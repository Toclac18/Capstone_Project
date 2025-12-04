import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

async function handlePOST(
  _req: Request,
  ctx: { params: Promise<{ enrollmentId: string }> },
) {
  const { enrollmentId } = await ctx.params;

  if (USE_MOCK) {
    // Mock success response
    return jsonResponse(
      "Invitation rejected successfully",
      {
        status: 200,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      },
    );
  }

  // Get authentication from shared helper
  const authHeader = await getAuthHeader();
  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }

  const upstream = await fetch(`${BE_BASE}/api/reader/enrollments/${enrollmentId}/reject`, {
    method: "POST",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/reader/enrollments/[enrollmentId]/reject/route.ts/POST",
  });

