import {
  getMyOrganizations as getMyOrganizationsService,
  getOrganizationById as getOrganizationByIdService,
  leaveOrganization as leaveOrganizationService,
  type OrganizationListResponse,
  type OrganizationSummary,
  type OrganizationDetail,
} from "@/services/organizations.service";

export type {
  OrganizationListResponse,
  OrganizationSummary,
  OrganizationDetail,
};

export async function fetchOrganizations(): Promise<OrganizationListResponse> {
  return getMyOrganizationsService();
}

export async function fetchOrganizationDetail(
  id: string,
): Promise<OrganizationDetail> {
  return getOrganizationByIdService(id);
}

export async function leaveOrganization(
  id: string,
): Promise<{ message: string }> {
  return leaveOrganizationService(id);
}
