import { mockDocumentsDB } from "@/mock/dbMock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handleGET() {
  if (USE_MOCK) {
    const domains = mockDocumentsDB.getDomains();
    return jsonResponse(domains, { status: 200, mode: "mock" });
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
