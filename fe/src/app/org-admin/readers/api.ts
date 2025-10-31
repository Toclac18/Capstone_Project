// src/app/admin/readers/api.ts

import { apiClient } from "@/services/http";

export type ReaderItem = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  coinBalance: number;
};

export async function fetchReaders(): Promise<{
  items: ReaderItem[];
  total: number;
}> {
  const res = await apiClient.get("/org-admin/readers");
  return res.data;
}

/**
 * Đổi trạng thái truy cập:
 *  - enable = false => remove access (SUSPENDED)
 *  - enable = true  => enable access (ACTIVE)
 */
export async function changeReaderAccess(
  userId: string,
  enable: boolean,
): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.post("/org-admin/reader-change-access", {
    userId,
    enable,
  });
  return res.data;
}
