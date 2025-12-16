import { NextRequest } from "next/server";
import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

type RouteContext = {
  params: Promise<{ reviewId: string }>;
};

/**
 * PUT /api/business-admin/review-results/[reviewId]/approve
 * Approve or reject a review result
 */
async function handlePUT(req: NextRequest, context: RouteContext): Promise<Response> {
  const { reviewId } = await context.params;

  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const fh = new Headers({ "Content-Type": "application/json" });
    fh.set("Authorization", authHeader);

    const upstream = await fetch(
      `${BE_BASE}/api/admin/review-results/${reviewId}/approve`,
      {
        method: "PUT",
        headers: fh,
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    return proxyJsonResponse(upstream, { mode: "real" });
  } catch (e: unknown) {
    return jsonResponse(
      { message: "Failed to approve review result", error: String(e) },
      { status: 502 },
    );
  }
}

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/business-admin/review-results/[reviewId]/approve/route.ts/PUT",
  });
