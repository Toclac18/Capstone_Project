// src/app/api/docs-view/[id]/redeem/route.ts
import { mockRedeemDoc } from "@/mock/docs-detail.mock";
import { buildForwardHeaders } from "../../_utils";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { badRequest, proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePOST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) return badRequest("Missing id");

  if (USE_MOCK) {
    const result = mockRedeemDoc(id);
    return jsonResponse(result, {
      status: result.success ? 200 : 404,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const fh = await buildForwardHeaders();

  const upstream = await fetch(`${BE_BASE}/api/documents/${id}/redeem`, {
    method: "POST",
    headers: fh,
    cache: "no-store",
  });

  // Backend returns 204 No Content on success
  if (upstream.status === 204) {
    return jsonResponse(
      {
        success: true,
        redeemed: true,
      },
      {
        status: 200,
        mode: "real",
      },
    );
  }

  // If error, proxy the error response
  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  // For other success statuses, return the response as-is
  return proxyJsonResponse(upstream, { mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/docs-view/[id]/redeem/route.ts/POST",
  });
