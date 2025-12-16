import { apiClient } from "@/services/http";

export type UploaderInfo = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
};

export type DocumentInfo = {
  id: string;
  title: string;
  description: string | null;
  isPremium: boolean;
  thumbnailUrl: string | null;
  docTypeName: string;
  specializationName: string;
  domainName: string;
  tagNames: string[];
  uploader: UploaderInfo;
};

export type ReadHistoryItem = {
  id: string;
  readAt: string;
  document: DocumentInfo;
};

export type PageInfo = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ReadHistoryResponse = {
  data: ReadHistoryItem[];
  pageInfo: PageInfo;
};

export type ReadHistoryParams = {
  page?: number;
  size?: number;
};

export async function fetchReadHistory(
  params: ReadHistoryParams = {}
): Promise<ReadHistoryResponse> {
  const { page = 0, size = 10 } = params;
  const res = await apiClient.get<ReadHistoryResponse>("/documents/read-history", {
    params: { page, size },
  });
  return res.data;
}
