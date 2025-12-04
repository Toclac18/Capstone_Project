import { mockOrganizationsDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

async function handlePOST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  if (USE_MOCK) {
    const ok = mockOrganizationsDB.leave(id);
    if (!ok) {
      return jsonResponse(
        { error: "Organization not found" },
        {
          status: 404,
          headers: { "content-type": "application/json", "x-mode": "mock" },
        },
      );
    }
    return jsonResponse(
      { message: "Left organization" },
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

  const upstream = await fetch(`${BE_BASE}/api/reader/enrollments/organizations/${id}/leave`, {
    method: "POST",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/reader/organizations/[id]/leave/route.ts/POST",
  });
