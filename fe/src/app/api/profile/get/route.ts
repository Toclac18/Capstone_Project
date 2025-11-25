// app/api/profile/get/route.ts
import { mockProfileDB } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

export const dynamic = "force-dynamic";

async function handleGET(request: Request) {
  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  if (USE_MOCK) {
    // Extract role from query param or default to READER
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "READER";
    const profile = mockProfileDB.get(role);
    // Backend response format: { data: ProfileResponse }
    return jsonResponse(
      { data: profile },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  const upstream = await fetch(`${BE_BASE}/api/profile`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/profile/get/route.ts/GET",
  });
