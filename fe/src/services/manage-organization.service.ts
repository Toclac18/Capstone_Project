import { apiClient } from "./http";

// Backend response format
export type OrganizationInfoResponse = {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  point: number | null;
  status: string;
  orgName: string;
  orgType: string;
  orgEmail: string;
  orgHotline: string;
  orgLogo: string | null;
  orgAddress: string;
  orgRegistrationNumber: string;
  createdAt: string;
  updatedAt: string;
  certificateUpload?: string | null; // May not be in response
};

// Frontend format
export type OrganizationInfo = {
  id: string;
  name: string;
  type: string;
  registrationNumber: string;
  certificateUpload?: string | null; // URL or file name
  email: string;
  hotline?: string | null;
  address?: string | null;
  adminName?: string | null;
  adminEmail?: string | null;
  createdAt: string; // ISO date string
  logo?: string | null; // Organization logo URL
};

export type UpdateOrganizationData = {
  fullName: string;
  name: string;
  type: string;
  email: string;
  hotline?: string;
  address?: string;
  registrationNumber: string;
};

/**
 * Get organization information for the logged-in organization admin
 */
export async function getOrganizationInfo(): Promise<OrganizationInfo> {
  const res = await apiClient.get<OrganizationInfoResponse>("/org-admin/manage-organization");
  // Response is already parsed by API route (extracted from { success, data, timestamp })
  const backendData = res.data;
  
  // Map backend response to frontend format
  return {
    id: backendData.userId,
    name: backendData.orgName,
    type: backendData.orgType,
    registrationNumber: backendData.orgRegistrationNumber,
    certificateUpload: backendData.certificateUpload || null,
    email: backendData.orgEmail,
    hotline: backendData.orgHotline || null,
    address: backendData.orgAddress || null,
    adminName: backendData.fullName || null,
    adminEmail: backendData.email || null,
    createdAt: backendData.createdAt,
    logo: backendData.orgLogo,
  };
}

/**
 * Update organization information for the logged-in organization admin
 */
export async function updateOrganizationInfo(
  data: UpdateOrganizationData
): Promise<OrganizationInfo> {
  const body = {
    fullName: data.fullName,
    name: data.name,
    type: data.type,
    email: data.email,
    hotline: data.hotline || "",
    address: data.address || "",
    registrationNumber: data.registrationNumber,
  };

  const res = await apiClient.put<OrganizationInfoResponse>(
    "/org-admin/manage-organization",
    body
  );
  // Response is returned directly from backend (no parsing needed)
  const backendData = res.data;
  
  // Map backend response to frontend format
  return {
    id: backendData.userId,
    name: backendData.orgName,
    type: backendData.orgType,
    registrationNumber: backendData.orgRegistrationNumber,
    certificateUpload: backendData.certificateUpload || null,
    email: backendData.orgEmail,
    hotline: backendData.orgHotline || null,
    address: backendData.orgAddress || null,
    adminName: backendData.fullName || null,
    adminEmail: backendData.email || null,
    createdAt: backendData.createdAt,
    logo: backendData.orgLogo,
  };
}

/**
 * Delete organization for the logged-in organization admin
 */
export async function deleteOrganization(): Promise<{ message: string }> {
  const res = await apiClient.delete<{ message: string }>(
    "/org-admin/manage-organization"
  );
  // Response is already parsed by API route (extracted from { success, data, timestamp })
  return res.data;
}

