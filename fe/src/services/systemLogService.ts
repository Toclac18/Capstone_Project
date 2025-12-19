import { apiClient } from "./http";
import type {
  SystemLog,
  SystemLogQueryParams,
  SystemLogListResponse,
} from "@/types/system-log";

// BE response wrapper
interface SuccessResponse<T> {
  data: T;
  meta?: any;
}

/**
 * Get system logs with query parameters
 */
export async function getSystemLogs(
  params?: SystemLogQueryParams,
): Promise<SystemLogListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.set("page", String(params.page));
  if (params?.limit) queryParams.set("limit", String(params.limit));
  if (params?.action) queryParams.set("action", params.action);
  if (params?.userId) queryParams.set("userId", params.userId);
  if (params?.targetUserId) queryParams.set("targetUserId", params.targetUserId);
  if (params?.userRole) queryParams.set("userRole", params.userRole);
  if (params?.ipAddress) queryParams.set("ipAddress", params.ipAddress);
  if (params?.startDate) queryParams.set("startDate", params.startDate);
  if (params?.endDate) queryParams.set("endDate", params.endDate);
  if (params?.search) queryParams.set("search", params.search);
  if (params?.sortBy) queryParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) queryParams.set("sortOrder", params.sortOrder);

  const queryString = queryParams.toString();
  const url = `/system-admin/logs${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient.get<SuccessResponse<SystemLogListResponse>>(url);
  
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<SystemLogListResponse>).data;
  }
  return res.data as SystemLogListResponse;
}

/**
 * Get system log by ID
 */
export async function getSystemLogById(
  id: string,
): Promise<SystemLog> {
  const res = await apiClient.get<SuccessResponse<SystemLog>>(`/system-admin/logs/${id}`);
  
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<SystemLog>).data;
  }
  return res.data as SystemLog;
}

