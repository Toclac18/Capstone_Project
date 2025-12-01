import { mockGetOrganizationStatistics } from "@/mock/statistics.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  if (USE_MOCK) {
    const statistics = mockGetOrganizationStatistics(startDate, endDate);
    return jsonResponse(statistics, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const authHeader = await getAuthHeader("statistics");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const queryParams = new URLSearchParams();
  if (startDate) {
    queryParams.append("startDate", startDate);
  }
  if (endDate) {
    queryParams.append("endDate", endDate);
  }

  const queryString = queryParams.toString();
  const url = `${BE_BASE}/api/statistics/organization${queryString ? `?${queryString}` : ""}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json();
  const statistics = responseData?.data || responseData;

  return jsonResponse(statistics, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET(request: Request) {
  return withErrorBoundary(() => handleGET(request), {
    context: "api/org-admin/statistics/route.ts/GET",
  });
}

