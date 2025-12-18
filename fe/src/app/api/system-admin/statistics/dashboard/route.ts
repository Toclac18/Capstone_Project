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
      overview: {
        totalUsers: 1250,
        totalOrganizations: 45,
        totalDocuments: 3200,
      },
      accessStatistics: {
        loginSuccessTrend: [],
        loginFailedTrend: [],
        activeUsersTrend: [],
        totalLoginsToday: 245,
        totalLoginsThisWeek: 1850,
        totalLoginsThisMonth: 8200,
        failedLoginsToday: 12,
        failedLoginsThisWeek: 85,
        failedLoginsThisMonth: 320,
        activeUsersLast7Days: 680,
        activeUsersLast30Days: 980,
      },
      userActivity: {
        userGrowthByRole: [],
        userStatusBreakdown: [
          { status: "ACTIVE", count: 980 },
          { status: "INACTIVE", count: 150 },
          { status: "PENDING_EMAIL_VERIFY", count: 100 },
          { status: "PENDING_APPROVE", count: 20 },
        ],
        newUsersRegistration: [],
        totalReaders: 800,
        totalReviewers: 300,
        totalOrganizationAdmins: 150,
        totalBusinessAdmins: 0,
        newUsersToday: 5,
        newUsersThisWeek: 28,
        newUsersThisMonth: 95,
      },
      systemActivity: {
        documentsUploaded: [],
        organizationsCreated: [],
        systemActionsBreakdown: [
          { action: "DOCUMENT_UPLOAD", count: 450 },
          { action: "DOCUMENT_VIEW", count: 3200 },
          { action: "ORGANIZATION_CREATE", count: 12 },
          { action: "USER_REGISTER", count: 95 },
          { action: "DOCUMENT_COMMENT", count: 280 },
        ],
        systemActionsTrend: [],
      },
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

  const url = `${BE_BASE}/api/statistics/system-admin/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

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
        error: errorText || "Failed to fetch dashboard statistics",
      };
    }
    console.error("System Admin dashboard API error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(
      errorData.error ||
        errorData.message ||
        "Failed to fetch dashboard statistics",
    );
  }

  const responseData = await response.json();

  // Extract data from wrapper response if present
  // Backend returns: { success: true, data: {...}, timestamp: ... }
  // Frontend expects: SystemAdminDashboard directly
  const dashboardData = responseData?.data || responseData;

  return jsonResponse(dashboardData, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET(request: Request) {
  return withErrorBoundary(() => handleGET(request), {
    context: "api/system-admin/statistics/dashboard/route.ts/GET",
  });
}
