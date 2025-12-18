import { apiClient } from "./http";

export type DocumentHistoryStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DocumentHistory = {
  id: string;
  documentName: string;
  uploadDate: string;
  type: string;
  domain: string;
  specialization: string;
  fileSize: number; // in bytes
  status: DocumentHistoryStatus;
  canRequestReview: boolean; // true if rejected and first time (can request re-review)
  isPremium: boolean; // true if document is premium
};

export type UploadHistoryQueryParams = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  domain?: string;
  status?: DocumentHistoryStatus;
  page?: number;
  limit?: number;
};

export type UploadHistoryResponse = {
  documents: DocumentHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Get upload history with filters
 */
export async function getUploadHistory(
  params?: UploadHistoryQueryParams
): Promise<UploadHistoryResponse> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
  if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
  if (params?.type) queryParams.append("type", params.type);
  if (params?.domain) queryParams.append("domain", params.domain);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const queryString = queryParams.toString();
  const url = `/reader/documents/upload-history${queryString ? `?${queryString}` : ""}`;
  
  const res = await apiClient.get<UploadHistoryResponse>(url);
  return res.data;
}



