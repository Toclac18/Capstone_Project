import {
  getUploadHistory as getUploadHistoryService,
  type DocumentHistory,
  type DocumentHistoryStatus,
  type UploadHistoryQueryParams,
  type UploadHistoryResponse,
} from "@/services/upload-history.service";

export type {
  DocumentHistory,
  DocumentHistoryStatus,
  UploadHistoryQueryParams,
  UploadHistoryResponse,
};

export async function fetchUploadHistory(
  params?: UploadHistoryQueryParams,
): Promise<UploadHistoryResponse> {
  return getUploadHistoryService(params);
}
