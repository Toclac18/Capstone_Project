// src/app/business-admin/organization/api.ts
import { apiClient } from "@/services/http";
import type {
  Organization,
  OrganizationResponse,
  OrganizationQueryParams,
} from "@/types/organization";

export type {
  Organization,
  OrganizationResponse,
  OrganizationQueryParams,
};

/**
 * Get list organizations with query parameters
 */
export async function getOrganizations(
  params?: OrganizationQueryParams,
): Promise<OrganizationResponse> {
  const res = await apiClient.post<OrganizationResponse>(
    "/organizations",
    params || {},
  );
  return res.data;
}

/**
 * Update organization status (ACTIVE, INACTIVE)
 */
export async function updateOrganizationStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE",
): Promise<Organization> {
  const res = await apiClient.patch<Organization>(
    `/organizations/${id}/status`,
    { status },
  );
  return res.data;
}

/**
 * Get organization detail by ID
 */
export async function getOrganization(
  id: string,
): Promise<Organization & {
  totalMembers?: number;
  totalDocuments?: number;
}> {
  const res = await apiClient.get<Organization & {
    totalMembers?: number;
    totalDocuments?: number;
  }>(`/organizations/${id}`);
  return res.data;
}

/**
 * Delete organization
 */
export async function deleteOrganization(
  id: string,
): Promise<{ message: string }> {
  const res = await apiClient.delete<{ message: string }>(
    `/organizations/${id}`,
  );
  return res.data;
}

