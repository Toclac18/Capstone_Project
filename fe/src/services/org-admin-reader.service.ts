// src/services/org-admin-reader.service.ts
import { apiClient } from "./http";

/**
 * Trùng với enum OrgEnrollStatus ở BE:
 *
 * public enum OrgEnrollStatus {
 *   PENDING_INVITE("Pending invite"),
 *   JOINED("Joined"),
 *   REMOVED("Removed");
 * }
 */
export type OrgEnrollStatus = "PENDING_INVITE" | "JOINED" | "REMOVED";

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
  page: number; // 0-based (theo BE)
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
  page?: number; // 1-based cho FE, route sẽ convert sang 0-based nếu cần
  pageSize?: number;
  q?: string;
  status?: OrgEnrollStatus | "ALL";
}

/**
 * Gọi Next API route: GET /api/org-admin/readers
 * (với apiClient baseURL = "/api" => path = "org-admin/readers")
 *
 * Trả về đúng format BE:
 * {
 *   success,
 *   data: OrgEnrollment[],
 *   pageInfo,
 *   timestamp
 * }
 */
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
