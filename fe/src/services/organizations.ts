import { apiClient } from "./http";

export type OrganizationSummary = {
  id: string;
  name: string;
  type: string;
  joinDate: string;
  logo: string | null;
};

export type OrganizationListResponse = {
  items: OrganizationSummary[];
  total: number;
};

export async function getMyOrganizations(): Promise<OrganizationListResponse> {
  const res = await apiClient.get<OrganizationListResponse>("/reader/organizations");
  return res.data;
}

export type OrganizationDetail = {
  id: string;
  name: string;
  type: string;
  email: string;
  hotline: string;
  logo: string | null;
  address: string;
  joinDate: string;
};

export async function getOrganizationById(id: string): Promise<OrganizationDetail> {
  const res = await apiClient.get<OrganizationDetail>(`/reader/organizations/${id}`);
  return res.data;
}

export async function leaveOrganization(id: string, password: string): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>(
    `/reader/organizations/${id}/leave`,
    { password },
  );
  return res.data;
}


