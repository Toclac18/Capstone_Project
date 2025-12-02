// fe/src/services/orgAdmin-reader.ts
import { apiClient } from "./http";

/**
 * Một row trong mảng "data" BE trả về
 */
export type ReaderResponse = {
  enrollmentId: string;
  memberId: string;
  memberEmail: string;
  memberFullName: string;
  memberAvatarUrl: string | null;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  status: string; // ví dụ: "PENDING_INVITE", "ACTIVE", ...
  invitedAt: string;
  respondedAt: string | null;
};

export type ReadersListBackendResponse = {
  success: boolean;
  data: ReaderResponse[];
  pageInfo: {
    page: number; // 0-based
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp: string;
};

export type ReaderAccessPayload = {
  // tuỳ BE sẽ dùng enrollmentId hay memberId, tạm thời để userId
  userId: string;
  enable: boolean;
};

/** Lấy danh sách readers qua Next API (GET /api/org-admin/readers) */
export async function fetchReaders(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
}): Promise<ReadersListBackendResponse> {
  const res = await apiClient.get<ReadersListBackendResponse>(
    "/org-admin/readers",
    {
      params,
    },
  );
  return res.data;
}

/**
 * Đổi quyền truy cập reader qua Next API
 * (POST /api/org-admin/reader-change-access)
 * Lưu ý: đoạn này phụ thuộc BE thực tế — hiện giả định BE trả lại ReaderResponse
 */
export async function changeReaderAccess(
  payload: ReaderAccessPayload,
): Promise<ReaderResponse> {
  const body = { ...payload };
  const res = await apiClient.post<ReaderResponse>(
    "/org-admin/reader-change-access",
    body,
  );
  return res.data;
}
