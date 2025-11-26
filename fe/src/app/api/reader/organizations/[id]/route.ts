import { headers } from "next/headers";
import { mockOrganizationsDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (USE_MOCK) {
    const detail = mockOrganizationsDB.get(id);
    if (!detail) {
      return jsonResponse(
        { error: "Organization not found" },
        {
          status: 404,
          headers: { "content-type": "application/json", "x-mode": "mock" },
        },
      );
    }
    return jsonResponse(detail, {
      status: 200,
      headers: { "content-type": "application/json", "x-mode": "mock" },
    });
  }

  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);

  const upstream = await fetch(`${BE_BASE}/api/organizations/${id}`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/organizations/[id]/route.ts/GET",
  });
