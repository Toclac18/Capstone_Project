import { mockDocumentsDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { getAuthHeader } from "@/server/auth";

async function handleGET() {
  if (USE_MOCK) {
    const domains = mockDocumentsDB.getDomains();
    return jsonResponse(domains, { status: 200, mode: "mock" });
  }

  const bearerToken = await getAuthHeader("domains");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (bearerToken) {
    headers.set("Authorization", bearerToken);
  }

  // Public endpoint - no auth required
  const upstream = await fetch(`${BE_BASE}/api/reader/documents/domains`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/documents/domains/route.ts/GET",
  });
