import {
  getOrganizationInfo as getOrganizationInfoService,
  updateOrganizationInfo as updateOrganizationInfoService,
  deleteOrganization as deleteOrganizationService,
  type OrganizationInfo,
  type UpdateOrganizationData,
} from "@/services/manageOrganizationService";

export type { OrganizationInfo, UpdateOrganizationData };

export async function fetchOrganizationInfo(): Promise<OrganizationInfo> {
  return getOrganizationInfoService();
}

export async function updateOrganizationInfo(
  data: UpdateOrganizationData
): Promise<OrganizationInfo> {
  return updateOrganizationInfoService(data);
}

export async function deleteOrganization(): Promise<{ message: string }> {
  return deleteOrganizationService();
}

