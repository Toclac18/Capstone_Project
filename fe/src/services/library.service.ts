import { apiClient } from "./http";
export type LibraryDocument = {
  id: string;
  documentName: string;
  description?: string;
  uploadDate: string;
  type: string;
  domain: string;
  specializationId?: string;
  specializationName?: string;
  fileSize: number;
  source: "UPLOADED" | "REDEEMED";
  pages: number;
  reads: number;
  visibility: "PUBLIC" | "PRIVATE" | "INTERNAL";
  interest?: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  thumbnailUrl?: string;
  tagIds?: string[];
  organizationId?: string;
};

export type LibraryResponse = {
  documents: LibraryDocument[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  source?: "UPLOADED" | "REDEEMED";
  type?: string;
  domain?: string;
  typeId?: string;
  domainId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type UpdateDocumentRequest = {
  title: string;
  description: string;
  visibility: "PUBLIC" | "INTERNAL";
  typeId: string;
  domainId: string;
  specializationId: string;
  tagIds: string[];
  newTags?: string[];
  organizationId?: string;
};

export type UpdateDocumentResponse = {
  message: string;
};

export type DeleteDocumentResponse = {
  message: string;
};

/**
 * Get reader's library (approved uploaded documents + redeemed premium documents)
 */
export async function getLibrary(
  params?: LibraryQueryParams
): Promise<LibraryResponse> {
  const queryParams = new URLSearchParams();

  // Pagination - API route handles 0-based conversion
  if (params?.page) queryParams.append("page", (params.page - 1).toString());
  if (params?.limit) queryParams.append("size", params.limit.toString());

  // Search keyword
  if (params?.search) queryParams.append("searchKeyword", params.search);

  // Source filter
  if (params?.source === "UPLOADED") {
    queryParams.append("isOwned", "true");
  } else if (params?.source === "REDEEMED") {
    queryParams.append("isPurchased", "true");
  }

  // Type and Domain - use UUID
  if (params?.typeId) queryParams.append("docTypeId", params.typeId);
  if (params?.domainId) queryParams.append("domainId", params.domainId);

  // Date range
  if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
  if (params?.dateTo) queryParams.append("dateTo", params.dateTo);

  const queryString = queryParams.toString();
  const url = `/reader/library${queryString ? `?${queryString}` : ""}`;

  // API route transforms response to frontend format
  const res = await apiClient.get<LibraryResponse>(url);
  return res.data;
}

/**
 * Update a document in the library
 */
export async function updateDocument(
  documentId: string,
  data: UpdateDocumentRequest
): Promise<UpdateDocumentResponse> {
  const url = `/reader/library/${documentId}`;
  const res = await apiClient.put<UpdateDocumentResponse>(url, data);
  return res.data;
}

/**
 * Delete a document from the library
 */
export async function deleteDocument(
  documentId: string
): Promise<DeleteDocumentResponse> {
  const url = `/reader/library/${documentId}`;
  const res = await apiClient.delete<DeleteDocumentResponse>(url);
  return res.data;
}

