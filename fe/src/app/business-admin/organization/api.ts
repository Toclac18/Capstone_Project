// src/app/business-admin/organization/api.ts
import { apiClient } from "@/services/http";
import type {
  Organization,
  OrganizationResponse,
  OrganizationQueryParams,
  OrganizationStatus,
} from "@/types/organization";

export type {
  Organization,
  OrganizationResponse,
  OrganizationQueryParams,
  OrganizationStatus,
};

/**
 * Get list organizations with query parameters
 * Uses GET /api/business-admin/organizations
 */
export async function getOrganizations(
  params?: OrganizationQueryParams,
): Promise<OrganizationResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) {
    queryParams.append("page", String(params.page));
  }
  if (params?.limit) {
    queryParams.append("limit", String(params.limit));
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }
  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.sortBy) {
    queryParams.append("sort", params.sortBy);
  }
  if (params?.sortOrder) {
    queryParams.append("order", params.sortOrder);
  }

  const queryString = queryParams.toString();
  const url = `/business-admin/organizations${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient.get<OrganizationResponse>(url);
  return res.data;
}

/**
 * Get organization detail by ID
 * Uses GET /api/business-admin/organizations/[userId]
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
  }>(`/business-admin/organizations/${id}`);
  return res.data;
}

/**
 * Update organization status (PENDING_VERIFICATION, ACTIVE, DEACTIVE, DELETED)
 * Uses PUT /api/business-admin/organizations/[userId]/status
 */
export async function updateOrganizationStatus(
  id: string,
  status: OrganizationStatus | "PENDING_EMAIL_VERIFY" | "PENDING_APPROVE" | "ACTIVE" | "INACTIVE" | "REJECTED" | "DELETED",
): Promise<Organization & {
  totalMembers?: number;
  totalDocuments?: number;
}> {
  // Backend uses UserStatus enum directly, no mapping needed
  // Valid values: PENDING_EMAIL_VERIFY, PENDING_APPROVE, ACTIVE, INACTIVE, REJECTED, DELETED
  const backendStatus = status.toUpperCase();

  const res = await apiClient.put<Organization & {
    totalMembers?: number;
    totalDocuments?: number;
  }>(
    `/business-admin/organizations/${id}/status`,
    { status: backendStatus },
  );
  return res.data;
}

/**
 * Delete organization (if backend supports this endpoint)
 * Note: Backend may not have delete endpoint, only status update
 */
export async function deleteOrganization(
  id: string,
): Promise<{ message: string }> {
  // If backend doesn't support delete, we can update status to DELETED instead
  try {
    await updateOrganizationStatus(id, "DELETED");
    return { message: "Organization deleted successfully" };
  } catch (error) {
    throw new Error("Failed to delete organization");
  }
}

