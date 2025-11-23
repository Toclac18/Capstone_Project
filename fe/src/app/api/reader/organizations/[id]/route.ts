import { headers } from "next/headers";
import { mockOrganizationsDB } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { getAuthHeader } from "@/server/auth";

async function handleGET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (USE_MOCK) {
    const detail = mockOrganizationsDB.get(id);
    if (!detail) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      });
    }
    return new Response(JSON.stringify(detail), {
      status: 200,
      headers: { "content-type": "application/json", "x-mode": "mock" },
    });
  }

  const h = await headers();
  const jwtAuth =
    (await getAuthHeader("api/reader/organizations/[id]/route.ts")) || "";
  const authHeader = jwtAuth || h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);

  const upstream = await fetch(`${BE_BASE}/api/organizations/${id}`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/organizations/[id]/route.ts/GET",
  });
