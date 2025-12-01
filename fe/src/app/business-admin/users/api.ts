// src/app/business-admin/users/api.ts
import { apiClient } from "@/services/http";
import type { User, UserResponse, UserQueryParams } from "@/types/user";

export type { User, UserResponse, UserQueryParams };

/**
 * Get list of readers with query parameters
 * Uses GET /api/business-admin/users (which proxies to /api/admin/readers)
 */
export async function getReaders(
  params?: UserQueryParams,
): Promise<UserResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) {
    queryParams.append("page", String(params.page));
  }
  if (params?.limit) {
    queryParams.append("limit", String(params.limit));
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }
  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.sortBy) {
    queryParams.append("sort", params.sortBy);
  }
  if (params?.sortOrder) {
    queryParams.append("order", params.sortOrder);
  }

  const queryString = queryParams.toString();
  const url = `/business-admin/users${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient.get<UserResponse>(url);
  return res.data;
}

/**
 * Get list of reviewers with query parameters
 * Uses GET /api/business-admin/reviewers (which proxies to /api/admin/reviewers)
 */
export async function getReviewers(
  params?: UserQueryParams,
): Promise<UserResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) {
    queryParams.append("page", String(params.page));
  }
  if (params?.limit) {
    queryParams.append("limit", String(params.limit));
  }
  if (params?.search) {
    queryParams.append("search", params.search);
  }
  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.sortBy) {
    queryParams.append("sort", params.sortBy);
  }
  if (params?.sortOrder) {
    queryParams.append("order", params.sortOrder);
  }

  const queryString = queryParams.toString();
  const url = `/business-admin/reviewers${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient.get<UserResponse>(url);
  return res.data;
}

/**
 * Get reader detail by ID
 * Uses GET /api/business-admin/users/[userId]
 */
export async function getReader(id: string): Promise<User> {
  const res = await apiClient.get<User>(`/business-admin/users/${id}`);
  return res.data;
}

/**
 * Get reviewer detail by ID
 * Uses GET /api/business-admin/reviewers/[userId]
 */
export async function getReviewer(id: string): Promise<User> {
  const res = await apiClient.get<User>(`/business-admin/reviewers/${id}`);
  return res.data;
}

/**
 * Update reader status (ACTIVE, DEACTIVE, DELETED, etc.)
 * Uses PUT /api/business-admin/users/[userId]/status
 */
export async function updateReaderStatus(
  id: string,
  status: string,
): Promise<User> {
  const res = await apiClient.put<User>(`/business-admin/users/${id}/status`, { status });
  return res.data;
}

/**
 * Update reviewer status (ACTIVE, DEACTIVE, DELETED, etc.)
 * Uses PUT /api/business-admin/reviewers/[userId]/status
 */
export async function updateReviewerStatus(
  id: string,
  status: string,
): Promise<User> {
  const res = await apiClient.put<User>(`/business-admin/reviewers/${id}/status`, { status });
  return res.data;
}

// Legacy functions for backward compatibility
/**
 * @deprecated Use getReaders() instead
 */
export async function getUsers(
  params?: UserQueryParams,
): Promise<UserResponse> {
  return getReaders(params);
}

/**
 * @deprecated Use getReader() instead
 */
export async function getUser(id: string): Promise<User> {
  return getReader(id);
}

/**
 * @deprecated Use updateReaderStatus() or updateReviewerStatus() instead
 */
export async function updateUserStatus(
  id: string,
  status: string,
): Promise<User> {
  return updateReaderStatus(id, status);
}

