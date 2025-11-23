import { headers } from "next/headers";
import { mockOrganizationsDB } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { getAuthHeader } from "@/server/auth";

async function handlePOST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const bodyText = await req.text();
  let password = "";
  try {
    const parsed = bodyText ? JSON.parse(bodyText) : {};
    password = parsed.password || "";
  } catch {
    // ignore; will handle as validation error below
  }

  if (USE_MOCK) {
    if (!password) {
      return new Response(JSON.stringify({ error: "Password is required" }), {
        status: 400,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      });
    }
    const ok = mockOrganizationsDB.leave(id);
    if (!ok) {
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      });
    }
    return new Response(JSON.stringify({ message: "Left organization" }), {
      status: 200,
      headers: { "content-type": "application/json", "x-mode": "mock" },
    });
  }

  const h = await headers();
  const jwtAuth = (await getAuthHeader("api/reader/organizations/[id]/leave/route.ts")) || "";
  const authHeader = jwtAuth || h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";
  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);

  const upstream = await fetch(`${BE_BASE}/api/organizations/${id}/leave`, {
    method: "POST",
    headers: fh,
    cache: "no-store",
    body: JSON.stringify({ password }),
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

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/reader/organizations/[id]/leave/route.ts/POST",
  });