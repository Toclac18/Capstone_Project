// src/app/business-admin/users/api.ts
import { apiClient } from "@/services/http";
import type { User, UserResponse, UserQueryParams } from "@/types/user";

export type { User, UserResponse, UserQueryParams };

// BE response wrapper
interface SuccessResponse<T> {
  data: T;
  meta?: any;
}

/**
 * Lấy danh sách users với query parameters
 */
export async function getUsers(
  params?: UserQueryParams,
): Promise<UserResponse> {
  const res = await apiClient.post<SuccessResponse<UserResponse>>("/users", params || {});
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<UserResponse>).data;
  }
  return res.data as UserResponse;
}

/**
 * Cập nhật status của user (ACTIVE, INACTIVE, DELETED)
 */
export async function updateUserStatus(
  id: string,
  status: string,
): Promise<User> {
  const res = await apiClient.patch<SuccessResponse<User>>(`/users/${id}/status`, { status });
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<User>).data;
  }
  return res.data as User;
}

