// src/app/api/homepage/route.ts

import {
  mockContinueReading,
  mockLibraryDocs,
  mockSpecializationGroups,
  mockTopUpvoted,
} from "@/mock/documentsMock";
import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, parseError } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

type GroupType = "continueReading" | "topUpvoted" | "bySpecialization" | "all";

async function handleGET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const group = (url.searchParams.get("group") || "all") as GroupType;
  const specialization = (url.searchParams.get("specialization") || "").trim();
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 12);
  const mode = (url.searchParams.get("mode") || "").toLowerCase();

  if (USE_MOCK) {
    // Paged / grouped mode
    if (mode === "paged" || group !== "all") {
      let pool = mockLibraryDocs;

      if (group === "continueReading") pool = mockContinueReading;
      if (group === "topUpvoted") pool = mockTopUpvoted;
      if (group === "bySpecialization" && specialization) {
        pool = mockLibraryDocs.filter(
          (d) => d.specialization === specialization,
        );
      }

      const filtered = pool.filter((d) => {
        if (!q) return true;
        const hay = [
          d.title,
          d.points || "",
          d.specialization,
          d.uploader,
          d.orgName,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });

      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      return jsonResponse(
        { items, total: filtered.length, page, pageSize },
        { status: 200, mode: "mock-paged" },
      );
    }

    // Bulk mode
    return jsonResponse(
      {
        continueReading: mockContinueReading,
        topUpvoted: mockTopUpvoted,
        specializations: mockSpecializationGroups,
      },
      { status: 200, mode: "mock-bulk" },
    );
  }

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (group && group !== "all") qs.set("group", group);
  if (specialization) qs.set("specialization", specialization);
  qs.set("page", String(page));
  qs.set("pageSize", String(pageSize));

  const authHeader = await getAuthHeader("homepage");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/homepage?${qs.toString()}`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    return jsonResponse(
      {
        error: parseError(text, "Homepage fetch failed"),
      },
      { status: upstream.status, mode: "real" },
    );
  }

  try {
    const raw = JSON.parse(text);
    const payload = (raw as any)?.data ?? raw;
    return jsonResponse(payload, { status: 200, mode: "real" });
  } catch {
    return jsonResponse(
      { error: "Failed to parse upstream homepage response" },
      { status: 500, mode: "real" },
    );
  }
}

// Wrapped with global error boundary
export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/homepage/route.ts/GET",
  });
