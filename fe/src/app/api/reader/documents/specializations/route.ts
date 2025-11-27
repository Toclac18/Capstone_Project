import { mockDocumentsDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse, proxyJsonResponse, parseError } from "@/server/response";
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
  // Backend endpoint: GET /public/domains/{domainId}/specializations
  if (domainIds.length === 0) {
    return jsonResponse(
      { error: "domainIds parameter is required" },
      { status: 400 }
    );
  }

  // If single domainId, fetch and parse response
  if (domainIds.length === 1) {
    const upstream = await fetch(
      `${BE_BASE}/api/public/domains/${domainIds[0]}/specializations`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    if (!upstream.ok) {
      const text = await upstream.text();
      return jsonResponse(
        { error: parseError(text, "Failed to fetch specializations") },
        { status: upstream.status }
      );
    }

    // Parse response - backend may return { success: true, data: [...], timestamp: ... } or direct array
    const responseData = await upstream.json();
    const specializations = Array.isArray(responseData) 
      ? responseData 
      : (responseData?.data || []);

    return jsonResponse(specializations, { status: upstream.status, mode: "real" });
  }

  // If multiple domainIds, fetch all and merge results
  const allSpecializations: any[] = [];
  for (const domainId of domainIds) {
    try {
      const upstream = await fetch(
        `${BE_BASE}/api/public/domains/${domainId}/specializations`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );

      if (upstream.ok) {
        // Use proxyJsonResponse to get the response, then parse
        const response = await proxyJsonResponse(upstream, { mode: "real" });
        const data = await response.json();
        // Backend returns List<SpecializationInfo> or wrapped in ApiResponse
        const specializations = Array.isArray(data) ? data : (data?.data || []);
        allSpecializations.push(...specializations);
      }
    } catch (error) {
      console.error(`Failed to fetch specializations for domain ${domainId}:`, error);
    }
  }

  return jsonResponse(allSpecializations, { status: 200, mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/documents/specializations/route.ts/GET",
  });
