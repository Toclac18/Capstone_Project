import type {
  PersonalDocumentStatistics,
  OrganizationStatistics,
  BusinessAdminDashboard,
  GlobalDocumentStatistics,
  ReportHandlingStatistics,
  StatisticsQueryParams,
} from "@/types/statistics";
import type { UserStatistics } from "@/app/business-admin/dashboard/_components/UserStatisticsTab";
import type { ReviewerStatistics, StatisticsQueryParams as ReviewerStatsQueryParams } from "@/types/reviewer-statistics";

export async function getPersonalStatistics(
  params?: StatisticsQueryParams
): Promise<PersonalDocumentStatistics> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }

  const queryString = queryParams.toString();
  const url = `/api/reader/statistics${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch statistics" }));
    throw new Error(error.error || "Failed to fetch statistics");
  }

  const data = await response.json();
  return data;
}

export async function getOrganizationStatistics(
  params?: StatisticsQueryParams
): Promise<OrganizationStatistics> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }

  const queryString = queryParams.toString();
  
  // If organizationId is provided, use business admin endpoint, otherwise use org-admin endpoint
  const url = params?.organizationId
    ? `/api/statistics/organization/${params.organizationId}${queryString ? `?${queryString}` : ""}`
    : `/api/org-admin/statistics${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch statistics" }));
    throw new Error(error.error || "Failed to fetch statistics");
  }

  const data = await response.json();
  return data;
}

export async function getBusinessAdminDashboard(): Promise<BusinessAdminDashboard> {
  const response = await fetch("/api/business-admin/statistics/dashboard", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch dashboard" }));
    throw new Error(error.error || "Failed to fetch dashboard");
  }

  const data = await response.json();
  return data;
}

export async function getGlobalDocumentStatistics(
  params?: StatisticsQueryParams
): Promise<GlobalDocumentStatistics> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }

  const queryString = queryParams.toString();
  const url = `/api/business-admin/statistics/documents${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch statistics" }));
    throw new Error(error.error || "Failed to fetch statistics");
  }

  const data = await response.json();
  return data;
}

export async function getReportHandlingStatistics(
  params?: StatisticsQueryParams
): Promise<ReportHandlingStatistics> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }

  const queryString = queryParams.toString();
  const url = `/api/business-admin/statistics/reports${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch statistics" }));
    throw new Error(error.error || "Failed to fetch statistics");
  }

  const data = await response.json();
  return data;
}

export async function getUserStatistics(
  params?: StatisticsQueryParams
): Promise<UserStatistics> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }

  const queryString = queryParams.toString();
  const url = `/api/business-admin/statistics/users${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
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
    console.error("getUserStatistics error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(errorData.error || errorData.message || "Failed to fetch user statistics");
  }

  const data = await response.json();
  return data;
}

export async function getGlobalOrganizationStatistics(
  params?: StatisticsQueryParams
): Promise<import("@/app/business-admin/dashboard/_components/OrganizationStatisticsTab").GlobalOrganizationStatistics> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }

  const queryString = queryParams.toString();
  const url = `/api/business-admin/statistics/organizations${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch organization statistics" }));
    throw new Error(error.error || "Failed to fetch organization statistics");
  }

  const data = await response.json();
  return data;
}

export async function getSystemAdminDashboard(
  params?: StatisticsQueryParams
): Promise<import("@/app/admin/dashboard/_components/types").SystemAdminDashboard> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }

  const queryString = queryParams.toString();
  const url = `/api/system-admin/statistics/dashboard${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText || "Failed to fetch dashboard statistics" };
    }
    console.error("getSystemAdminDashboard error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(errorData.error || errorData.message || "Failed to fetch dashboard statistics");
  }

  const data = await response.json();
  return data;
}

export async function getReviewerStatistics(
  params?: ReviewerStatsQueryParams
): Promise<ReviewerStatistics> {
  const queryParams = new URLSearchParams();
  if (params?.startDate) {
    queryParams.append("startDate", params.startDate);
  }
  if (params?.endDate) {
    queryParams.append("endDate", params.endDate);
  }

  const queryString = queryParams.toString();
  const url = `/api/reviewer/statistics${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch statistics" }));
    throw new Error(error.error || "Failed to fetch statistics");
  }

  const data = await response.json();
  return data;
}

