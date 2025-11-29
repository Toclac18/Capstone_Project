import { apiClient } from "./http";
import type {
  Tag,
  TagQueryParams,
  TagResponse,
  CreateTagRequest,
  UpdateTagRequest,
} from "@/types/document-tag";

/**
 * Get tags with pagination and filters
 */
export async function getTags(params?: TagQueryParams): Promise<TagResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.limit) queryParams.append("limit", String(params.limit));
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
  if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
  // Note: sortBy and sortOrder are handled in FE, not sent to BE

  const url = `/business-admin/tags${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const res = await apiClient.get<TagResponse>(url);
  return res.data;
}

/**
 * Create a new tag
 */
export async function createTag(data: CreateTagRequest): Promise<Tag> {
  const res = await apiClient.post<Tag>("/business-admin/tags", data);
  return res.data;
}

/**
 * Update an existing tag
 */
export async function updateTag(
  id: string,
  data: UpdateTagRequest
): Promise<Tag> {
  const res = await apiClient.put<Tag>(`/business-admin/tags/${id}`, data);
  return res.data;
}

/**
 * Delete a tag (reject)
 */
export async function deleteTag(id: string): Promise<void> {
  await apiClient.delete(`/business-admin/tags/${id}`);
}

/**
 * Review (approve/reject) a pending tag
 */
export async function approveTag(id: string, approved: boolean = true): Promise<void> {
  await apiClient.post(`/business-admin/tags/${id}`, { approved });
}

/**
 * Reject a pending tag (alias for approveTag with approved=false)
 */
export async function rejectTag(id: string): Promise<void> {
  await approveTag(id, false);
}

