import { NextRequest } from "next/server";
import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

/**
 * GET /api/business-admin/review-results/pending
 * Get all pending review results waiting for BA approval
 */
async function handleGET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "10";

  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const fh = new Headers({ "Content-Type": "application/json" });
    fh.set("Authorization", authHeader);

    const upstream = await fetch(
      `${BE_BASE}/api/admin/review-results/pending?page=${page}&size=${size}`,
      {
        method: "GET",
        headers: fh,
        cache: "no-store",
      },
    );

    return proxyJsonResponse(upstream, { mode: "real" });
  } catch (e: unknown) {
    return jsonResponse(
      { message: "Failed to fetch pending review results", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/business-admin/review-results/pending/route.ts/GET",
  });
