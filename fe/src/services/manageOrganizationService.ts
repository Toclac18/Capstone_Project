import { apiClient } from "./http";

export type OrganizationInfo = {
  id: string;
  name: string;
  type: string;
  registrationNumber: string;
  certificateUpload?: string | null; // URL or file name
  email: string;
  createdAt: string; // ISO date string
  logo?: string | null; // Organization logo URL
};

export type UpdateOrganizationData = {
  name: string;
  type: string;
  email: string;
  registrationNumber: string;
  certificateUpload?: File | null;
};

/**
 * Get organization information for the logged-in organization admin
 */
export async function getOrganizationInfo(): Promise<OrganizationInfo> {
  const res = await apiClient.get<OrganizationInfo>("/organization-admin/manage-organization");
  return res.data;
}

/**
 * Update organization information for the logged-in organization admin
 */
export async function updateOrganizationInfo(
  data: UpdateOrganizationData
): Promise<OrganizationInfo> {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("type", data.type);
  formData.append("email", data.email);
  formData.append("registrationNumber", data.registrationNumber);
  if (data.certificateUpload) {
    formData.append("certificateUpload", data.certificateUpload);
  }

  // Axios will automatically set Content-Type with boundary for FormData
  // We need to explicitly remove default Content-Type header for FormData
  const res = await apiClient.put<OrganizationInfo>(
    "/organization-admin/manage-organization",
    formData,
    {
      headers: {
        "Content-Type": undefined, // Let axios set it automatically
      },
    }
  );
  return res.data;
}

/**
 * Delete organization for the logged-in organization admin
 */
export async function deleteOrganization(): Promise<{ message: string }> {
  const res = await apiClient.delete<{ message: string }>(
    "/organization-admin/manage-organization"
  );
  return res.data;
}

