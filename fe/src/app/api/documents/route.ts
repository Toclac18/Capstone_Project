// app/api/documents/route.ts

import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { mockGetDocDetail } from "@/mock/docsDetailMock";
import { getDocuments } from "@/mock/business-admin-documents";

/**
 * This route proxies document detail by id using a query param (?id=...).
 * It preserves the original behavior: require id in query, then call
 * BE_BASE/api/documents/{id} with Authorization from cookie.
 */
async function handleGET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return jsonResponse({ error: "Document ID is required" }, { status: 400 });
  }

  if (USE_MOCK) {
    const result = mockGetDocDetail(id);
    if (!result) {
      return jsonResponse({ error: "Document not found" }, {
        status: 404,
        mode: "mock",
      });
    }
    return jsonResponse(result, { status: 200, mode: "mock" });
  }

  try {
    const authHeader = await getAuthHeader();

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/documents/${id}`, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    return proxyJsonResponse(upstream, { mode: "real" });
  } catch (e: any) {
    return jsonResponse(
      { message: "Document fetch failed", error: String(e) },
      { status: 502 },
    );
  }
}

async function handlePOST(req: NextRequest): Promise<Response> {
  if (USE_MOCK) {
    const body = await req.json().catch(() => ({}));
    
    const params = {
      page: body?.page || 1,
      limit: body?.limit || 10,
      search: body?.search || undefined,
      organizationId: body?.organizationId || undefined,
      typeId: body?.typeId || undefined,
      isPublic: body?.isPublic !== undefined ? body.isPublic : undefined,
      isPremium: body?.isPremium !== undefined ? body.isPremium : undefined,
      dateFrom: body?.dateFrom || undefined,
      dateTo: body?.dateTo || undefined,
      sortBy: body?.sortBy || undefined,
      sortOrder: body?.sortOrder || undefined,
    };

    const result = getDocuments(params);
    return jsonResponse(result, { status: 200, mode: "mock" });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = await getAuthHeader();

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/documents`, {
      method: "POST",
      headers: fh,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    return proxyJsonResponse(upstream, { mode: "real" });
  } catch (e: any) {
    return jsonResponse(
      { message: "Documents fetch failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/documents/route.ts/GET",
  });

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/documents/route.ts/POST",
  });
