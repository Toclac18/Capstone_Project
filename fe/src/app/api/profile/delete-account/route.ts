// app/api/profile/delete-account/route.ts
import { headers } from "next/headers";
import { mockProfileDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

export const dynamic = "force-dynamic";

async function handlePOST(req: Request) {
  let body: { password: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      { error: "Invalid JSON body" },
      {
        status: 400,
        headers: { "content-type": "application/json" },
      },
    );
  }

  if (USE_MOCK) {
    mockProfileDB.clear();
    return new Response(
      JSON.stringify({
        message: "Account deleted successfully. (mock)",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);

  const upstream = await fetch(`${BE_BASE}/api/profile/delete-account`, {
    method: "POST",
    headers: fh,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/profile/delete-account/route.ts/POST",
  });
