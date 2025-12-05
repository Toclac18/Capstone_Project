import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { jsonResponse } from "@/server/response";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (USE_MOCK) {
    // Mock response matching backend structure
    const mockStats = {
      summary: {
        totalUsers: 1250,
        activeUsers: 980,
        inactiveUsers: 150,
        pendingVerificationUsers: 120,
        totalReaders: 800,
        totalReviewers: 300,
        totalOrganizationAdmins: 150,
        newUsersThisMonth: 45,
        newUsersLastMonth: 38,
        growthRate: 18.42,
      },
      userGrowth: [],
      activeUsersGrowth: [],
      roleBreakdown: [
        {
          role: "READER",
          total: 800,
          active: 650,
          inactive: 100,
          pendingVerification: 50,
        },
        {
          role: "REVIEWER",
          total: 300,
          active: 250,
          inactive: 30,
          pendingVerification: 20,
        },
        {
          role: "ORGANIZATION_ADMIN",
          total: 150,
          active: 80,
          inactive: 20,
          pendingVerification: 50,
        },
      ],
      statusBreakdown: [
        { status: "ACTIVE", count: 980 },
        { status: "DEACTIVE", count: 150 },
        { status: "PENDING_EMAIL_VERIFY", count: 100 },
        { status: "PENDING_APPROVE", count: 20 },
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

  const url = `${BE_BASE}/api/statistics/business-admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

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
      errorData = { error: errorText || "Failed to fetch user statistics" };
    }
    console.error("User statistics API error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(errorData.error || errorData.message || "Failed to fetch user statistics");
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
    context: "api/business-admin/statistics/users/route.ts/GET",
  });
}


