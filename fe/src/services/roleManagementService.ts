// Service for role management API calls
import { apiClient } from "./http";
import type { User, UserResponse, UserQueryParams } from "@/types/user";
import type { ChangeRoleRequest, ChangeRoleResponse } from "@/types/role-management";

// BE response wrapper
interface SuccessResponse<T> {
  data: T;
  meta?: any;
}

/**
 * Get users with query parameters for role management
 */
export async function getUsersForRoleManagement(
  params?: UserQueryParams,
): Promise<UserResponse> {
  const res = await apiClient.post<SuccessResponse<UserResponse>>(
    "/system-admin/users",
    params || {}
  );
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<UserResponse>).data;
  }
  return res.data as UserResponse;
}

/**
 * Change user role
 */
export async function changeUserRole(
  userId: string,
  data: ChangeRoleRequest,
): Promise<ChangeRoleResponse> {
  const res = await apiClient.patch<SuccessResponse<ChangeRoleResponse>>(
    `/system-admin/users/${userId}/role`,
    data
  );
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<ChangeRoleResponse>).data;
  }
  return res.data as ChangeRoleResponse;
}

