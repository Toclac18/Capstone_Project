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

// BE response wrapper
interface SuccessResponse<T> {
  data: T;
  meta?: any;
}

/**
 * Get list organizations with query parameters
 */
export async function getOrganizations(
  params?: OrganizationQueryParams,
): Promise<OrganizationResponse> {
  const res = await apiClient.post<SuccessResponse<OrganizationResponse>>(
    "/organizations",
    params || {},
  );
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<OrganizationResponse>).data;
  }
  return res.data as OrganizationResponse;
}

/**
 * Update organization status (ACTIVE, INACTIVE)
 */
export async function updateOrganizationStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE",
): Promise<Organization & {
  totalMembers?: number;
  totalDocuments?: number;
}> {
  const res = await apiClient.patch<SuccessResponse<Organization & {
    totalMembers?: number;
    totalDocuments?: number;
  }>>(
    `/organizations/${id}/status`,
    { status },
  );
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Organization & {
      totalMembers?: number;
      totalDocuments?: number;
    }>).data;
  }
  return res.data as Organization & {
    totalMembers?: number;
    totalDocuments?: number;
  };
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
  const res = await apiClient.get<SuccessResponse<Organization & {
    totalMembers?: number;
    totalDocuments?: number;
  }>>(`/organizations/${id}`);
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<Organization & {
      totalMembers?: number;
      totalDocuments?: number;
    }>).data;
  }
  return res.data as Organization & {
    totalMembers?: number;
    totalDocuments?: number;
  };
}

/**
 * Delete organization
 */
export async function deleteOrganization(
  id: string,
): Promise<{ message: string }> {
  const res = await apiClient.delete<SuccessResponse<{ message: string }>>(
    `/organizations/${id}`,
  );
  // Handle SuccessResponse wrapper - delete might return null data
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    const data = (res.data as SuccessResponse<{ message: string } | null>).data;
    return data || { message: "Organization deleted successfully" };
  }
  return res.data as { message: string } || { message: "Organization deleted successfully" };
}

