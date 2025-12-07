// src/app/business-admin/document/api.ts
import { apiClient } from "@/services/http";
import type {
  DocumentListItem,
  DocumentDetail,
  DocumentListResponse,
  DocumentQueryParams,
  DocumentStatistics,
} from "@/types/document-management";

export type {
  DocumentListItem,
  DocumentDetail,
  DocumentListResponse,
  DocumentQueryParams,
  DocumentStatistics,
};

// BE response wrapper
interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * Get list documents with query parameters
 * Uses GET /business-admin/documents (goes through Next.js API route)
 */
export async function getDocuments(
  params?: DocumentQueryParams,
): Promise<DocumentListResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.page !== undefined) {
    queryParams.append("page", String(params.page - 1)); // Backend uses 0-based
  }
  if (params?.limit !== undefined) {
    queryParams.append("size", String(params.limit));
  }
  if (params?.search) {
    queryParams.append("title", params.search);
  }
  if (params?.organizationId) {
    queryParams.append("organizationId", params.organizationId);
  }
  if (params?.typeId) {
    queryParams.append("docTypeId", params.typeId);
  }
  if (params?.isPremium !== undefined) {
    queryParams.append("isPremium", String(params.isPremium));
  }
  if (params?.isPublic !== undefined) {
    queryParams.append("visibility", params.isPublic ? "PUBLIC" : "PRIVATE");
  }
  if (params?.status) {
    queryParams.append("status", params.status);
  }
  if (params?.dateFrom) {
    // Convert YYYY-MM-DD to ISO date-time (start of day)
    const dateFrom = new Date(params.dateFrom);
    dateFrom.setHours(0, 0, 0, 0);
    queryParams.append("dateFrom", dateFrom.toISOString());
  }
  if (params?.dateTo) {
    // Convert YYYY-MM-DD to ISO date-time (end of day)
    const dateTo = new Date(params.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    queryParams.append("dateTo", dateTo.toISOString());
  }
  // Sort parameters - Spring Data format: sort=fieldName,direction
  if (params?.sortBy) {
    const sortDirection = params.sortOrder || "desc";
    queryParams.append("sort", `${params.sortBy},${sortDirection}`);
  }
  
  const res = await apiClient.get<DocumentListResponse>(
    `/business-admin/documents?${queryParams.toString()}`,
  );
  
  return res.data;
}

/**
 * Get document detail by ID
 * Uses GET /business-admin/documents/{id} (goes through Next.js API route)
 */
export async function getDocument(
  id: string,
): Promise<DocumentDetail> {
  const res = await apiClient.get<DocumentDetail>(
    `/business-admin/documents/${id}`,
  );
  return res.data;
}

/**
 * Get document statistics
 * Uses GET /business-admin/documents/statistics (goes through Next.js API route)
 */
export async function getDocumentStatistics(): Promise<DocumentStatistics> {
  const res = await apiClient.get<DocumentStatistics>(
    "/business-admin/documents/statistics",
  );
  return res.data;
}

/**
 * Activate document
 * Uses PATCH /business-admin/documents/{id}/activate (goes through Next.js API route)
 */
export async function activateDocument(id: string): Promise<void> {
  await apiClient.patch(`/business-admin/documents/${id}/activate`);
}

/**
 * Deactivate document
 * Uses PATCH /business-admin/documents/{id}/deactivate (goes through Next.js API route)
 */
export async function deactivateDocument(id: string): Promise<void> {
  await apiClient.patch(`/business-admin/documents/${id}/deactivate`);
}

/**
 * Delete document (for admin - uses deactivate)
 * Uses PATCH /business-admin/documents/{id}/deactivate
 * Note: Admin cannot directly delete documents, so we deactivate them instead.
 */
export async function deleteDocument(id: string): Promise<void> {
  await deactivateDocument(id);
}

