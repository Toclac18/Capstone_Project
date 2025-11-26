import {
  getUploadHistory as getUploadHistoryService,
  requestReReview as requestReReviewService,
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

export async function requestReReview(
  documentId: string,
  reason: string,
): Promise<{ message: string }> {
  return requestReReviewService(documentId, reason);
}
