// src/app/api/homepage/route.ts
import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, parseError } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

import {
  mockContinueReading,
  mockLibraryDocs,
  mockSpecializationGroups,
  mockTopUpvoted,
} from "@/mock/documents.mock";

const toQs = (params: Record<string, any>) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  });
  return qs.toString();
};

async function fetchReadHistory(authHeader: string | null) {
  if (!authHeader) return [];

  const res = await fetch(`${BE_BASE}/documents/read-history?page=0&size=20`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error("BE /documents/read-history error:", res.status, txt);
    return [];
  }

  const txt = await res.text();
  const raw = JSON.parse(txt);

  // Shape: { success, data: [ { id, readAt, document: {...} } ], pageInfo, ... }
  const items = Array.isArray(raw?.data) ? raw.data : [];

  // Ta chỉ cần phần document bên trong cho continueReading
  return items.map((h: any) => h?.document).filter((d: any) => !!d);
}

async function handleGET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "bulk";

  // Paged params
  const q = (url.searchParams.get("q") || "").trim();
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 12);

  // ===========================
  // MOCK MODE
  // ===========================
  if (USE_MOCK) {
    if (mode === "paged") {
      let pool = [...mockLibraryDocs];

      if (q) {
        const lower = q.toLowerCase();
        pool = pool.filter((d) => d.title.toLowerCase().includes(lower));
      }

      const start = (page - 1) * pageSize;
      const items = pool.slice(start, start + pageSize);

      return jsonResponse(
        { items, total: pool.length, page, pageSize },
        { status: 200, mode: "mock-paged" },
      );
    }

    const specGroups = (mockSpecializationGroups || []).map((g) => ({
      name: g.name,
      items: g.items,
    }));

    return jsonResponse(
      {
        continueReading: mockContinueReading,
        topUpvoted: mockTopUpvoted,
        specGroups,
      },
      { status: 200, mode: "mock-bulk" },
    );
  }

  // ===========================
  // REAL BACKEND MODE
  // ===========================

  const authHeader = await getAuthHeader("homepage");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  // ────────────────────────────────────────────────
  // A. PAGED MODE: dùng cho search/filter
  // ────────────────────────────────────────────────
  if (mode === "paged") {
    try {
      const bePage = page > 0 ? page - 1 : 0;

      const qs = toQs({
        page: bePage,
        size: pageSize,
        q,
      });

      const url = `${BE_BASE}/api/documents/homepage?${qs}`;

      const res = await fetch(url, {
        method: "GET",
        headers: fh,
        cache: "no-store",
      });

      const txt = await res.text();
      if (!res.ok) {
        return jsonResponse(
          { error: parseError(txt, "Homepage paged search failed") },
          { status: res.status },
        );
      }

      const raw = JSON.parse(txt);
      const pageData = raw?.data || raw;

      const items = pageData?.content || [];
      const total = pageData?.totalElements ?? items.length;

      return jsonResponse(
        { items, total, page, pageSize },
        { status: 200, mode: "real-paged" },
      );
    } catch (e: any) {
      return jsonResponse({ error: e.message }, { status: 500 });
    }
  }

  // ────────────────────────────────────────────────
  // B. BULK MODE = LOAD HOMEPAGE
  // ────────────────────────────────────────────────

  try {
    // Lấy 50 tài liệu cho homepage
    const qs = toQs({ page: 0, size: 50 });
    const homepageUrl = `${BE_BASE}/api/documents/homepage?${qs}`;

    const res = await fetch(homepageUrl, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("BE /documents/homepage error:", txt);
      return jsonResponse(
        { continueReading: [], topUpvoted: [], specGroups: [] },
        { status: 200, mode: "fallback" },
      );
    }

    const txt = await res.text();
    const raw = JSON.parse(txt);
    const pageData = raw?.data || raw;

    const docs: any[] = pageData?.content || [];

    // ────────────────────────────────────────────────
    // 1. Continue reading → gọi BE /read-history nếu login
    // ────────────────────────────────────────────────
    const continueReading = authHeader
      ? await fetchReadHistory(authHeader)
      : [];

    // ────────────────────────────────────────────────
    // 2. Top upvoted = sort theo voteScore then createdAt
    // ────────────────────────────────────────────────
    const topUpvoted = [...docs]
      .sort(
        (a, b) =>
          (b.voteScore ?? 0) - (a.voteScore ?? 0) ||
          new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
      )
      .slice(0, 8);

    // ────────────────────────────────────────────────
    // 3. Spec groups = group theo specialization.name
    // ────────────────────────────────────────────────
    const map = new Map<string, any[]>();

    docs.forEach((d) => {
      const spec = d.specialization?.name || "General";
      if (!map.has(spec)) map.set(spec, []);
      const arr = map.get(spec)!;
      if (arr.length < 8) arr.push(d);
    });

    const specGroups = Array.from(map.entries()).map(([name, items]) => ({
      name,
      items,
    }));

    return jsonResponse(
      { continueReading, topUpvoted, specGroups },
      { status: 200, mode: "real-bulk" },
    );
  } catch (e: any) {
    console.error("Homepage bulk error:", e);
    return jsonResponse(
      { continueReading: [], topUpvoted: [], specGroups: [] },
      { status: 200, mode: "error" },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/homepage/GET",
  });
