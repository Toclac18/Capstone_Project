import { NextRequest } from "next/server";
import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

/**
 * GET /api/business-admin/review-results
 * Get all review results with optional status filter
 */
async function handleGET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "10";
  const status = searchParams.get("status");

  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const fh = new Headers({ "Content-Type": "application/json" });
    fh.set("Authorization", authHeader);

    let url = `${BE_BASE}/api/admin/review-results?page=${page}&size=${size}`;
    if (status) {
      url += `&status=${status}`;
    }

    const upstream = await fetch(url, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    return proxyJsonResponse(upstream, { mode: "real" });
  } catch (e: unknown) {
    return jsonResponse(
      { message: "Failed to fetch review results", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/business-admin/review-results/route.ts/GET",
  });
