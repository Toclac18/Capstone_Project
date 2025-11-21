import { apiClient } from "./http";
import type {
  ReviewListResponse,
  ReviewRequestsResponse,
  ReviewHistoryResponse,
  ReviewListQueryParams,
  ReviewHistoryQueryParams,
  ReviewAction,
} from "@/types/review";

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString();
}

/**
 * Get reviewer's todo/pending documents for review (assigned documents)
 */
export async function getTodoDocuments(
  params?: ReviewListQueryParams
): Promise<ReviewListResponse> {
  const queryString = buildQueryString({
    page: params?.page,
    limit: params?.limit,
    search: params?.search,
    status: "PENDING",
  });
  const url = `/reviewer/review-list${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient.get<ReviewListResponse>(url);
  return res.data;
}

/**
 * Get reviewer's review requests (documents waiting for invitation acceptance)
 */
export async function getReviewRequests(
  params?: Omit<ReviewListQueryParams, "status">
): Promise<ReviewRequestsResponse> {
  const queryString = buildQueryString({
    page: params?.page,
    limit: params?.limit,
    search: params?.search,
  });
  const url = `/reviewer/review-list/requests${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient.get<ReviewRequestsResponse>(url);
  return res.data;
}

/**
 * Get reviewer's review history
 */
export async function getReviewedHistory(
  params?: ReviewHistoryQueryParams
): Promise<ReviewHistoryResponse> {
  const queryString = buildQueryString({
    page: params?.page,
    limit: params?.limit,
    search: params?.search,
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    type: params?.type,
    domain: params?.domain,
    specialization: params?.specialization,
    active: params?.active,
    rejected: params?.rejected,
  });
  const url = `/reviewer/review-list/history${queryString ? `?${queryString}` : ""}`;

  const res = await apiClient.get<ReviewHistoryResponse>(url);
  return res.data;
}

/**
 * Submit review for a document (approve or reject) with report file
 */
export async function submitReview(
  documentId: string,
  action: ReviewAction,
  reportFile: File
): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("action", action);
  formData.append("reportFile", reportFile);

  const queryString = buildQueryString({ action });
  const url = `/reviewer/review-list/${documentId}/review${
    queryString ? `?${queryString}` : ""
  }`;
  const res = await apiClient.post<{ message: string }>(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

/**
 * Approve or reject a review request (single approve API)
 */
export async function approveReviewRequest(
  requestId: string,
  action: ReviewAction
): Promise<{ message: string }> {
  const url = `/reviewer/review-list/requests/${requestId}/approve`;
  const res = await apiClient.post<{ message: string }>(url, { action });
  return res.data;
}


