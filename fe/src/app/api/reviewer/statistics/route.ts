import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (USE_MOCK) {
    return jsonResponse({
      summary: {
        totalReviewRequests: 0,
        totalReviewsCompleted: 0,
        totalReviewsApproved: 0,
        totalReviewsRejected: 0,
        pendingReviewRequests: 0,
        acceptedReviewRequests: 0,
        rejectedReviewRequests: 0,
        expiredReviewRequests: 0,
        completedReviewRequests: 0,
      },
      reviewRequestStatusBreakdown: {},
      reviewDecisionBreakdown: {},
      reviewsByMonth: {},
      averageReviewTimeDays: 0,
    }, {
      status: 200,
      mode: "mock",
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

  const url = `${BE_BASE}/api/statistics/reviewer${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  console.log(`[reviewer-statistics] Calling backend: ${url}`);

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json().catch(() => ({}));
  const data = responseData?.data || responseData;

  return jsonResponse(data, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET(request: Request) {
  return withErrorBoundary(() => handleGET(request), {
    context: "api/reviewer/statistics/route.ts/GET",
  });
}


