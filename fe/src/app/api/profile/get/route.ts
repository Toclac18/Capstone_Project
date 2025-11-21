// app/api/profile/get/route.ts
import { cookies } from "next/headers";
import { mockProfileDB } from "@/mock/db";
import { BE_BASE, COOKIE_NAME, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";

export const dynamic = "force-dynamic";

async function handleGET(request: Request) {
  const cookieStore = await cookies();

  const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

  if (USE_MOCK) {
    // Extract role from query param or default to READER
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "READER";
    const profile = mockProfileDB.get(role);
    // Backend response format: { data: ProfileResponse }
    return new Response(JSON.stringify({ data: profile }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Backend chỉ nhận Authorization header, không nhận cookie
  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/profile`, {
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
    context: "api/profile/get/route.ts/GET",
  });
