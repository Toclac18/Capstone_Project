import {
  getOrganizationInfo as getOrganizationInfoService,
  updateOrganizationInfo as updateOrganizationInfoService,
  deleteOrganization as deleteOrganizationService,
  type OrganizationInfo,
  type UpdateOrganizationData,
} from "@/services/manage-organization.service";

export type { OrganizationInfo, UpdateOrganizationData };

export async function fetchOrganizationInfo(): Promise<OrganizationInfo> {
  return getOrganizationInfoService();
}

export async function updateOrganizationInfo(
  data: UpdateOrganizationData,
): Promise<OrganizationInfo> {
  return updateOrganizationInfoService(data);
}

export async function deleteOrganization(password: string): Promise<{ message: string }> {
  return deleteOrganizationService(password);
}

/**
 * Upload organization logo
 * POST /api/org-admin/profile/logo
 */
export async function uploadLogo(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/org-admin/profile/logo", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to upload logo" }));
    throw new Error(error.error || error.message || "Failed to upload logo");
  }
}
