import { apiClient } from "./http";

export type OrgEnrollmentResponse = {
  enrollmentId: string;
  memberId: string;
  memberEmail: string;
  memberFullName: string;
  memberAvatarUrl: string | null;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  status: string;
  invitedAt: string;
  respondedAt: string;
};

export type PagedResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

export type InvitationsQueryParams = {
  page?: number;
  size?: number;
};

/**
 * Get pending invitations for the authenticated reader
 * GET /api/v1/reader/enrollments/invitations
 */
export async function getPendingInvitations(
  params?: InvitationsQueryParams
): Promise<PagedResponse<OrgEnrollmentResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) {
    queryParams.append("page", String(params.page));
  }
  if (params?.size !== undefined) {
    queryParams.append("size", String(params.size));
  }

  const url = `/reader/enrollments/invitations${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const res = await apiClient.get<PagedResponse<OrgEnrollmentResponse>>(url);
  return res.data;
}

/**
 * Accept organization invitation
 * POST /api/v1/reader/enrollments/{enrollmentId}/accept
 */
export async function acceptInvitation(enrollmentId: string): Promise<string> {
  const res = await apiClient.post<string>(`/reader/enrollments/${enrollmentId}/accept`);
  return res.data;
}

/**
 * Reject organization invitation
 * POST /api/v1/reader/enrollments/{enrollmentId}/reject
 */
export async function rejectInvitation(enrollmentId: string): Promise<string> {
  const res = await apiClient.post<string>(`/reader/enrollments/${enrollmentId}/reject`);
  return res.data;
}

