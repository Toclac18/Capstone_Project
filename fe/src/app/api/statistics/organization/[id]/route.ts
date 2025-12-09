import { mockGetOrganizationStatistics } from "@/mock/statistics.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { jsonResponse } from "@/server/response";

async function handleGET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: userIdOrOrgId } = await params;
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

  // The id might be userId (from AdminOrganizationResponse) or organizationId
  // Backend statistics API expects organizationId (OrganizationProfile ID)
  // But AdminOrganizationResponse only has userId (admin user ID)
  // We need to resolve organizationId from userId
  // Strategy: Try calling statistics API with the provided id
  // If it fails with "Organization not found", try to resolve it from userId
  const organizationId = userIdOrOrgId;

  const queryParams = new URLSearchParams();
  if (startDate) {
    queryParams.append("startDate", startDate);
  }
  if (endDate) {
    queryParams.append("endDate", endDate);
  }

  const queryString = queryParams.toString();
  const url = `${BE_BASE}/api/statistics/organization/${organizationId}${queryString ? `?${queryString}` : ""}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const errorText = await upstream.text();
    let errorMessage = "Failed to fetch statistics";
    let errorJson: any = {};
    try {
      errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    // If error is "Organization not found", the id might be userId instead of organizationId
    // We need to resolve organizationId from userId
    // Backend StatisticsController has organizationProfileRepository.findByAdminId()
    // but we can't call it directly. We need to modify backend or create a helper endpoint.
    // For now, return a clear error message
    if (errorMessage.includes("Organization not found")) {
      return jsonResponse(
        {
          error:
            "Organization not found. The provided ID appears to be a user ID (admin ID) rather than an organization ID. The system needs the organization profile ID to fetch statistics.",
          details: errorMessage,
          hint: "Please ensure the organization list includes the organization profile ID, not just the admin user ID.",
        },
        {
          status: upstream.status,
          headers: {
            "content-type": "application/json",
            "x-mode": "real",
          },
        },
      );
    }

    return jsonResponse(
      { error: errorMessage },
      {
        status: upstream.status,
        headers: {
          "content-type": "application/json",
          "x-mode": "real",
        },
      },
    );
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorBoundary(() => handleGET(request, { params }), {
    context: "api/statistics/organization/[id]/route.ts/GET",
  });
}
