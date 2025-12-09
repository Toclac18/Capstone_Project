import { mockDocumentsDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

async function handleGET() {
  if (USE_MOCK) {
    const types = mockDocumentsDB.getTypes();
    return jsonResponse(types, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const bearerToken = await getAuthHeader("types");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/doc-types`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  // Parse response - backend returns ResponseEntity<List<DocType>> (direct array)
  const responseData = await upstream.json();
  const types = Array.isArray(responseData)
    ? responseData
    : responseData?.data || [];

  return jsonResponse(types, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/documents/types/route.ts/GET",
  });
