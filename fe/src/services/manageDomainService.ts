import { apiClient } from "./http";
import type {
  Domain,
  DomainQueryParams,
  DomainResponse,
  CreateDomainRequest,
  UpdateDomainRequest,
} from "@/types/document-domain";

/**
 * Get domains with pagination and filters
 */
export async function getDomains(params?: DomainQueryParams): Promise<DomainResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.limit) queryParams.append("limit", String(params.limit));
  if (params?.search) queryParams.append("search", params.search);
  if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
  if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
  // Note: sortBy and sortOrder are handled in FE, not sent to BE

  const url = `/business-admin/domains${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const res = await apiClient.get<DomainResponse>(url);
  return res.data;
}

/**
 * Create a new domain
 */
export async function createDomain(data: CreateDomainRequest): Promise<Domain> {
  const res = await apiClient.post<Domain>("/business-admin/domains", data);
  return res.data;
}

/**
 * Update an existing domain
 */
export async function updateDomain(
  id: string,
  data: UpdateDomainRequest
): Promise<Domain> {
  const res = await apiClient.put<Domain>(`/business-admin/domains/${id}`, data);
  return res.data;
}

