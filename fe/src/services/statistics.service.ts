import type {
  PersonalDocumentStatistics,
  OrganizationStatistics,
  StatisticsQueryParams,
} from "@/types/statistics";

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
  const url = `/api/org-admin/statistics${queryString ? `?${queryString}` : ""}`;

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

