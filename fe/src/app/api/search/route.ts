// src/app/api/search/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { searchDocumentMocks } from "@/mock/search-document.mock";

// Nếu muốn có mock search theo page
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

async function forwardToBE(path: string, body: any) {
  const h = headers();
  const cookieStore = cookies();

  const headerAuth = (await h).get("authorization") || "";
  const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth;

  return fetch(`${BE_BASE}${path}`, {
    method: "POST",
    headers: {
      ...(effectiveAuth ? { Authorization: effectiveAuth } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

async function handlePOST(req: NextRequest): Promise<Response> {
  const filterBody = await req.json();

  if (USE_MOCK) {
    const body = buildPagedFromMocks(filterBody);
    return NextResponse.json(body, { status: 200 });
  }

  // NHÁNH REAL BE
  const upstream = await forwardToBE("/api/documents/search", filterBody);
  const body = await upstream.json();
  return NextResponse.json(body, { status: upstream.status });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/search/route.ts/POST",
  });
