// src/services/org-admin-reader.service.ts
import { apiClient } from "./http";

export type OrgEnrollStatus = "PENDING_INVITE" | "JOINED" | "REMOVED" | "LEFT";

export type ChangeEnrollmentStatusPayload = {
  enrollmentId: string;
  status: OrgEnrollStatus;
};

export async function changeEnrollmentStatus(
  payload: ChangeEnrollmentStatusPayload,
): Promise<OrgEnrollment> {
  const res = await apiClient.put<OrgEnrollment>(
    "org-admin/reader-change-access",
    payload,
  );
  return res.data;
}

export async function inviteMember(
  enrollmentId: string,
): Promise<{ success: boolean; message?: string }> {
  const res = await apiClient.post("org-admin/readers/invite", {
    enrollmentId,
  });
  return res.data;
}

export interface OrgEnrollment {
  enrollmentId: string;
  memberId: string;
  memberEmail: string;
  memberFullName: string;
  memberAvatarUrl: string | null;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  status: OrgEnrollStatus;
  invitedAt: string;
  respondedAt: string | null;
}

export interface OrgEnrollmentPageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface OrgEnrollmentListResponse {
  success: boolean;
  data: OrgEnrollment[];
  pageInfo: OrgEnrollmentPageInfo;
  timestamp: string;
}

export interface FetchReadersParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: OrgEnrollStatus | "ALL";
}

export async function fetchReaders(
  params: FetchReadersParams = {},
): Promise<OrgEnrollmentListResponse> {
  const { page = 1, pageSize = 10, q = "", status = "ALL" } = params;

  const res = await apiClient.get<OrgEnrollmentListResponse>(
    "org-admin/readers",
    {
      params: {
        page,
        pageSize,
        q,
        status,
      },
    },
  );

  return res.data;
}
