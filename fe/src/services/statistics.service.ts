import type {
  PersonalDocumentStatistics,
  OrganizationStatistics,
  BusinessAdminDashboard,
  GlobalDocumentStatistics,
  ReportHandlingStatistics,
  StatisticsQueryParams,
} from "@/types/statistics";
import type { UserStatistics } from "@/app/business-admin/dashboard/_components/UserStatisticsTab";

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

export async function getUserStatistics(): Promise<UserStatistics> {
  const response = await fetch("/api/business-admin/statistics/users", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch user statistics" }));
    throw new Error(error.error || "Failed to fetch user statistics");
  }

  const data = await response.json();
  return data;
}

