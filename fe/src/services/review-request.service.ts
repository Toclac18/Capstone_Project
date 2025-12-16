// src/services/review-request.service.ts
import { apiClient } from "./http";
import type {
  ReviewRequestResponse,
  AssignReviewerRequest,
  ReviewRequestListResponse,
} from "@/types/review-request";

/**
 * Assign a reviewer to review a document
 * POST /business-admin/documents/{documentId}/review-requests
 */
export async function assignReviewer(
  documentId: string,
  request: AssignReviewerRequest,
): Promise<ReviewRequestResponse> {
  const res = await apiClient.post<ReviewRequestResponse>(
    `/business-admin/documents/${documentId}/review-requests`,
    request,
  );
  return res.data;
}

/**
 * Get all review requests for a specific document
 * GET /business-admin/documents/{documentId}/review-requests
 */
export async function getDocumentReviewRequests(
  documentId: string,
  page: number = 0,
  size: number = 10,
): Promise<ReviewRequestListResponse> {
  const res = await apiClient.get<ReviewRequestListResponse>(
    `/business-admin/documents/${documentId}/review-requests?page=${page}&size=${size}`,
  );
  return res.data;
}

/**
 * Get all review requests in the system
 * GET /business-admin/review-requests
 */
export async function getAllReviewRequests(
  page: number = 0,
  size: number = 10,
): Promise<ReviewRequestListResponse> {
  const res = await apiClient.get<{
    content: ReviewRequestResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  }>(`/business-admin/review-requests?page=${page}&size=${size}`);
  
  // Map backend response to frontend type
  return {
    content: res.data.content || [],
    totalElements: res.data.totalElements || 0,
    totalPages: res.data.totalPages || 0,
    number: res.data.number || page,
    size: res.data.size || size,
  };
}

/**
 * Review Result Types (renamed from DocumentReview)
 */
export interface ReviewResultResponse {
  id: string;
  reviewRequestId: string;
  document: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    docType?: {
      id: string;
      name: string;
    };
    domain?: {
      id: string;
      name: string;
    };
    specialization?: {
      id: string;
      name: string;
    };
    tags?: Array<{
      id: string;
      name: string;
    }>;
  };
  reviewer?: {
    id: string;
    username: string;
    email: string;
  };
  report: string;
  reportFileUrl?: string;
  decision: "APPROVED" | "REJECTED";
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// Alias for backward compatibility
export type DocumentReviewResponse = ReviewResultResponse;

/**
 * Get review result by review request ID
 * GET /business-admin/review-requests/{reviewRequestId}/review
 */
export async function getReviewResultByReviewRequestId(
  reviewRequestId: string,
): Promise<ReviewResultResponse> {
  const res = await apiClient.get<ReviewResultResponse>(
    `/business-admin/review-requests/${reviewRequestId}/review`,
  );
  return res.data;
}

// Alias for backward compatibility
export const getDocumentReviewByReviewRequestId = getReviewResultByReviewRequestId;

