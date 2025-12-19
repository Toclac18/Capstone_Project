import { apiClient } from "./http";
import type {
  DocumentType,
  TypeQueryParams,
  TypeResponse,
  CreateTypeRequest,
  UpdateTypeRequest,
} from "@/types/document-type";

/**
 * Get types with pagination and filters
 */
export async function getTypes(params?: TypeQueryParams): Promise<TypeResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", String(params.page));
  if (params?.limit) queryParams.append("limit", String(params.limit));
  if (params?.search) queryParams.append("name", params.search);
  if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
  if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
  // Note: sortBy and sortOrder are handled in FE, not sent to BE

  const url = `/business-admin/types${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
  const res = await apiClient.get<TypeResponse>(url);
  return res.data;
}

/**
 * Create a new type
 */
export async function createType(data: CreateTypeRequest): Promise<DocumentType> {
  const res = await apiClient.post<DocumentType>("/business-admin/types", data);
  return res.data;
}

/**
 * Update an existing type
 */
export async function updateType(
  id: string,
  data: UpdateTypeRequest
): Promise<DocumentType> {
  const res = await apiClient.put<DocumentType>(`/business-admin/types/${id}`, data);
  return res.data;
}

