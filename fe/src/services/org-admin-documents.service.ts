import { apiClient } from "@/services/http";

export type DocStatus = "AI_VERIFYING" | "AI_REJECTED" | "PENDING_REVIEW" | "REVIEWING" | "PENDING_APPROVE" | "ACTIVE" | "REJECTED" | "INACTIVE" | "DELETED";
export type DocVisibility = "PUBLIC" | "INTERNAL";

export type UploaderInfo = {
  id: string;
  fullName: string;
  email: string;
};

export type DocTypeInfo = {
  id: string;
  name: string;
};

export type SpecializationInfo = {
  id: string;
  name: string;
  domainName: string | null;
};

export type OrgDocument = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  status: DocStatus;
  visibility: DocVisibility;
  isPremium: boolean;
  price: number | null;
  pageCount: number;
  viewCount: number;
  upvoteCount: number;
  createdAt: string;
  updatedAt: string;
  uploader: UploaderInfo | null;
  docType: DocTypeInfo | null;
  specialization: SpecializationInfo | null;
};

export type PageInfo = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type PagedResult<T> = {
  data: T[];
  pageInfo: PageInfo;
};

export type FetchParams = {
  search?: string;
  status?: DocStatus | "ALL";
  visibility?: DocVisibility | "ALL";
  page?: number;
  pageSize?: number;
};

export async function fetchOrgDocuments(params: FetchParams): Promise<PagedResult<OrgDocument>> {
  const { search, status, visibility, page = 1, pageSize = 10 } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page - 1)); // Backend uses 0-indexed
  queryParams.set("size", String(pageSize));
  
  if (search) {
    queryParams.set("search", search);
  }
  if (status && status !== "ALL") {
    queryParams.set("status", status);
  }
  if (visibility && visibility !== "ALL") {
    queryParams.set("visibility", visibility);
  }
  
  // Call Next.js API route which proxies to backend
  const res = await apiClient.get<PagedResult<OrgDocument>>(
    `/org-admin/documents?${queryParams.toString()}`
  );
  return res.data;
}

export async function activateDocument(documentId: string): Promise<OrgDocument> {
  // Call Next.js API route with action query param
  const res = await apiClient.put<OrgDocument>(
    `/org-admin/documents/${documentId}?action=activate`
  );
  return res.data;
}

export async function deactivateDocument(documentId: string): Promise<OrgDocument> {
  const res = await apiClient.put<OrgDocument>(
    `/org-admin/documents/${documentId}?action=deactivate`
  );
  return res.data;
}

export async function releaseDocument(documentId: string): Promise<OrgDocument> {
  const res = await apiClient.put<OrgDocument>(
    `/org-admin/documents/${documentId}?action=release`
  );
  return res.data;
}
