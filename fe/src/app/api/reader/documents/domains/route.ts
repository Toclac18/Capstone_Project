import { mockDocumentsDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, parseError } from "@/server/response";
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
  const upstream = await fetch(`${BE_BASE}/api/public/domains`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return jsonResponse(
      { error: parseError(text, "Failed to fetch domains") },
      { status: upstream.status }
    );
  }

  // Parse response - backend may return { success: true, data: [...], timestamp: ... } or direct array
  const responseData = await upstream.json();
  const domains = Array.isArray(responseData) 
    ? responseData 
    : (responseData?.data || []);

  return jsonResponse(domains, { status: upstream.status, mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/public/domains/route.ts/GET",
  });
