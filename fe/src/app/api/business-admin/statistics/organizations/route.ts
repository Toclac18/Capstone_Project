import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { jsonResponse } from "@/server/response";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (USE_MOCK) {
    // Mock response matching backend structure
    const mockStats = {
      summary: {
        totalOrganizations: 45,
        totalMembers: 1250,
        totalDocuments: 3200,
        totalViews: 125000,
        totalUpvotes: 8500,
        totalComments: 2100,
        activeOrganizations: 38,
        averageMembersPerOrganization: 27.8,
        averageDocumentsPerOrganization: 71.1,
        averageViewsPerOrganization: 2777.8,
      },
      organizationGrowth: [],
      memberGrowth: [],
      documentUploads: [],
      documentViews: [],
      topOrganizations: [
        {
          organizationId: "1",
          organizationName: "Organization A",
          memberCount: 150,
          documentCount: 450,
          viewCount: 25000,
          totalScore: 5000,
        },
        {
          organizationId: "2",
          organizationName: "Organization B",
          memberCount: 120,
          documentCount: 380,
          viewCount: 22000,
          totalScore: 4500,
        },
      ],
      organizationTypeBreakdown: [
        { type: "TYPE1", count: 20 },
        { type: "TYPE2", count: 15 },
        { type: "TYPE3", count: 10 },
      ],
      memberCountBreakdown: [
        { range: "1-50", count: 20 },
        { range: "51-100", count: 15 },
        { range: "101-200", count: 7 },
        { range: "201-500", count: 2 },
        { range: "501-1000", count: 1 },
        { range: "1000+", count: 0 },
      ],
    };

    return jsonResponse(mockStats, {
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
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  const url = `${BE_BASE}/api/statistics/business-admin/organizations${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = {
        error: errorText || "Failed to fetch organization statistics",
      };
    }
    console.error("Organization statistics API error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(
      errorData.error ||
        errorData.message ||
        "Failed to fetch organization statistics",
    );
  }

  const responseData = await response.json();
  // Handle response that might have data wrapped in 'data' field
  const data = responseData?.data || responseData;

  return jsonResponse(data, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET(request: Request) {
  return withErrorBoundary(() => handleGET(request), {
    context: "api/business-admin/statistics/organizations/route.ts/GET",
  });
}
