// src/app/api/search/route.ts
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { searchDocumentMocks } from "@/mock/search-document.mock";

// Mock search với pagination
function buildPagedFromMocks(filter: any) {
  const page = filter.page ?? 0;
  const size = filter.size ?? 20;
  const start = page * size;
  const end = start + size;

  const items = searchDocumentMocks.slice(start, end);
  const totalElements = searchDocumentMocks.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));

  return {
    success: true,
    data: items,
    pageInfo: {
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page + 1 >= totalPages,
      hasNext: page + 1 < totalPages,
      hasPrevious: page > 0,
    },
    timestamp: new Date().toISOString(),
  };
}

async function handlePOST(req: NextRequest): Promise<Response> {
  const filterBody = await req.json().catch(() => ({}));

  console.log(
    "[API /search] Request body:",
    JSON.stringify(filterBody, null, 2),
  );

  if (USE_MOCK) {
    const body = buildPagedFromMocks(filterBody);
    return jsonResponse(body, { status: 200, mode: "mock" });
  }

  // Real BE
  const authHeader = await getAuthHeader("search");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  console.log("[API /search] Calling BE:", `${BE_BASE}/api/documents/search`);

  const upstream = await fetch(`${BE_BASE}/api/documents/search`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify(filterBody),
    cache: "no-store",
  });

  console.log("[API /search] BE response status:", upstream.status);

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/search/route.ts/POST",
  });
