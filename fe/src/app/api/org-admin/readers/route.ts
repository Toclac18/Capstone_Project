// src/app/api/org-admin/readers/route.ts
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";
import { mockFetchReaders } from "@/mock/readers.mock";
import { OrgEnrollStatus } from "@/services/org-admin-reader.service";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function handleGET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const page = Number(searchParams.get("page") ?? DEFAULT_PAGE);
  const pageSize = Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "ALL";

  // ==========================
  // 1. MOCK MODE
  // ==========================
  if (USE_MOCK) {
    const payload = await mockFetchReaders({
      page,
      pageSize,
      q,
      status: status as OrgEnrollStatus | "ALL",
    });

    return jsonResponse(payload, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // ==========================
  // 2. REAL BE MODE
  // ==========================

  const upstreamUrl = new URL(`${BE_BASE}/api/organization/members`);

  upstreamUrl.searchParams.set("page", String(Math.max(page - 1, 0)));
  upstreamUrl.searchParams.set("size", String(pageSize));

  // Search & filter
  if (q) {
    upstreamUrl.searchParams.set("search", q);
  }
  if (status && status !== "ALL") {
    upstreamUrl.searchParams.set("status", status);
  }

  // Auth header
  const authHeader = await getAuthHeader();
  const fh = new Headers();
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }

  const upstream = await fetch(upstreamUrl.toString(), {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text || upstream.statusText, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "text/plain",
        "x-mode": "real-error",
      },
    });
  }

  const payload = await upstream.json();

  return jsonResponse(payload, {
    status: 200,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/org-admin/readers/route.ts/GET",
  });
