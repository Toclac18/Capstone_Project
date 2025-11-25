import { mockDocumentsDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { getAuthHeader } from "@/server/auth";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domainIdsParam = searchParams.get("domainIds");
  const domainIds = domainIdsParam
    ? domainIdsParam.split(",").filter(Boolean)
    : [];

  if (USE_MOCK) {
    const specializations = mockDocumentsDB.getSpecializations(domainIds);
    return jsonResponse(specializations, { status: 200, mode: "mock" });
  }

  const bearerToken = await getAuthHeader("domains");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (bearerToken) {
    headers.set("Authorization", bearerToken);
  }

  // Public endpoint - no auth required
  const url = domainIdsParam
    ? `${BE_BASE}/api/reader/documents/specializations?domainIds=${encodeURIComponent(domainIdsParam)}`
    : `${BE_BASE}/api/reader/documents/specializations`;

  const upstream = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/documents/specializations/route.ts/GET",
  });
