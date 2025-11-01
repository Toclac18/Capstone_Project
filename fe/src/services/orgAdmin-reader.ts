// fe/src/services/orgAdmin-reader.ts
import { apiClient } from "./http";

export type ReaderResponse = {
  message: string;
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  coinBalance: number;
};

export type ReaderAccessPayload = {
  userId: string;
  enable: boolean;
};

/** Lấy danh sách readers qua Next API (GET /api/org-admin/readers) */
export async function fetchReaders(): Promise<{
  items: ReaderResponse[];
  total: number;
}> {
  const res = await apiClient.get("/org-admin/readers");
  return res.data;
}

/** Đổi quyền truy cập reader qua Next API (POST /api/org-admin/reader-change-access) */
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
