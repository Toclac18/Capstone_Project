import { apiClient } from "./http";

export type LibraryDocument = {
  id: string;
  documentName: string;
  description?: string;
  uploadDate: string;
  type: string;
  domain: string;
  fileSize: number;
  source: "UPLOADED" | "PURCHASED";
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
};

export type LibraryQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  source?: "UPLOADED" | "PURCHASED";
  type?: string;
  domain?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type UpdateDocumentRequest = {
  title: string;
  description: string;
  visibility: "PUBLIC" | "INTERNAL";
  typeId: string;
  domainId: string;
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
 * Get reader's library (approved uploaded documents + purchased premium documents)
 */
export async function getLibrary(
  params?: LibraryQueryParams
): Promise<LibraryResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.search) queryParams.append("search", params.search);
  if (params?.source) queryParams.append("source", params.source);
  if (params?.type) queryParams.append("type", params.type);
  if (params?.domain) queryParams.append("domain", params.domain);
  if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
  if (params?.dateTo) queryParams.append("dateTo", params.dateTo);

  const queryString = queryParams.toString();
  const url = `/reader/library${queryString ? `?${queryString}` : ""}`;

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

