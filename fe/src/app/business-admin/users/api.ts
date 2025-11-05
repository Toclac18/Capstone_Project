// src/app/business-admin/users/api.ts
import { apiClient } from "@/services/http";
import type { User, UserResponse, UserQueryParams } from "@/types/user";

export type { User, UserResponse, UserQueryParams };

/**
 * Lấy danh sách users với query parameters
 */
export async function getUsers(
  params?: UserQueryParams,
): Promise<UserResponse> {
  const res = await apiClient.post<UserResponse>("/users", params || {});
  return res.data;
}

/**
 * Cập nhật status của user (ACTIVE, INACTIVE, DELETED)
 */
export async function updateUserStatus(
  id: string,
  status: string,
): Promise<User> {
  const res = await apiClient.patch<User>(`/users/${id}/status`, { status });
  return res.data;
}

