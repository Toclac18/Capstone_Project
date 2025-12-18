import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(_request: Request) {
  if (USE_MOCK) {
    return jsonResponse({
      totalDocuments: 100,
      totalActiveDocuments: 80,
      totalPremiumDocuments: 30,
      totalPublicDocuments: 70,
      statusBreakdown: {},
      visibilityBreakdown: {},
      totalViews: 1000,
      totalComments: 500,
      totalSaves: 200,
      totalVotes: 300,
      totalReports: 10,
      totalPurchases: 50,
      totalReviewRequests: 20,
      pendingReviewRequests: 5,
      acceptedReviewRequests: 10,
      completedReviews: 5,
      documentsUploadedLast30Days: 10,
      documentsActivatedLast30Days: 8,
    }, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const authHeader = await getAuthHeader("documents");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const url = `${BE_BASE}/api/admin/documents/statistics`;
  console.log(`[documents] Calling backend: ${url}`);

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
    context: "api/business-admin/documents/statistics/route.ts/GET",
  });
}


