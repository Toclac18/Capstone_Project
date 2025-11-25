// app/api/profile/update/route.ts
import { mockProfileDB, type ProfileData } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { getAuthHeader } from "@/server/auth";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

export const dynamic = "force-dynamic";

async function handlePUT(req: Request) {
  let body: Partial<ProfileData>;
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
    const updated = mockProfileDB.update(body);
    // Backend response format: { data: ProfileResponse }
    return jsonResponse(
      { data: updated },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  const bearerToken = await getAuthHeader();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/profile`, {
    method: "PUT",
    headers: fh,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/profile/update/route.ts/PUT",
  });
