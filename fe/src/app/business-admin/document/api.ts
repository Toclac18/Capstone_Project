// src/app/business-admin/document/api.ts
import { apiClient } from "@/services/http";
import type {
  DocumentListItem,
  DocumentDetail,
  DocumentListResponse,
  DocumentQueryParams,
} from "@/types/document-management";

export type {
  DocumentListItem,
  DocumentDetail,
  DocumentListResponse,
  DocumentQueryParams,
};

// BE response wrapper
interface SuccessResponse<T> {
  data: T;
  meta?: any;
}

/**
 * Get list documents with query parameters
 */
export async function getDocuments(
  params?: DocumentQueryParams,
): Promise<DocumentListResponse> {
  const res = await apiClient.post<SuccessResponse<DocumentListResponse>>(
    "/documents",
    params || {},
  );
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<DocumentListResponse>).data;
  }
  return res.data as DocumentListResponse;
}

/**
 * Get document detail by ID
 */
export async function getDocument(
  id: string,
): Promise<DocumentDetail> {
  const res = await apiClient.get<SuccessResponse<DocumentDetail>>(`/documents/${id}`);
  // Handle SuccessResponse wrapper
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    return (res.data as SuccessResponse<DocumentDetail>).data;
  }
  return res.data as DocumentDetail;
}

/**
 * Delete document
 */
export async function deleteDocument(
  id: string,
): Promise<{ message: string }> {
  const res = await apiClient.delete<SuccessResponse<{ message: string }>>(
    `/documents/${id}`,
  );
  // Handle SuccessResponse wrapper - delete might return null data
  if (res.data && typeof res.data === 'object' && 'data' in res.data) {
    const data = (res.data as SuccessResponse<{ message: string } | null>).data;
    return data || { message: "Document deleted successfully" };
  }
  return res.data as { message: string } || { message: "Document deleted successfully" };
}

