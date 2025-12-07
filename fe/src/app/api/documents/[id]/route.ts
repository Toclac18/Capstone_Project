// app/api/documents/[id]/route.ts

import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { mockGetDocDetail } from "@/mock/docs-detail.mock";

/**
 * This route proxies document detail by id via dynamic segment /documents/[id].
 * Original behavior: call BE_BASE/api/documents/{id} with Authorization.
 */
async function handleGET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (USE_MOCK) {
    const result = mockGetDocDetail(id);
    if (!result) {
      return jsonResponse(
        { error: "Document not found" },
        {
          status: 404,
          mode: "mock",
        },
      );
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

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/documents/[id]/route.ts/GET",
  });
