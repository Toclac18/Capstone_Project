// src/services/review-request.service.ts
import { apiClient } from "./http";
import type {
  ReviewRequestResponse,
  AssignReviewerRequest,
  ReviewRequestListResponse,
} from "@/types/review-request";

export interface ReviewManagementItem {
  documentId: string;
  title: string;
  documentStatus: string;
  isPremium?: boolean;
  specializationName?: string;
  reviewRequestId?: string | null;
  reviewRequestStatus?: string | null;
  reviewerId?: string | null;
  reviewerName?: string | null;
  reviewerEmail?: string | null;
  responseDeadline?: string | null;
  reviewDeadline?: string | null;
  decision?: "APPROVED" | "REJECTED" | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ReviewManagementResponse {
  items: ReviewManagementItem[];
  total: number;
  page: number;
  size: number;
}

export interface ReviewManagementQuery {
  tab?: "NEEDS_ASSIGNMENT" | "PENDING" | "IN_REVIEW" | "COMPLETED" | "ALL";
  reviewerId?: string;
  domain?: string;
  search?: string;
  sortBy?: "title" | "createdAt" | "deadline";
  sortOrder?: "asc" | "desc";
  page?: number; // 1-based on FE
  size?: number;
}

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
 * Get review management aggregated list for Business Admin.
 */
export async function getReviewManagement(
  query: ReviewManagementQuery,
): Promise<ReviewManagementResponse> {
  const params = new URLSearchParams();
  const page = query.page ?? 1;
  const size = query.size ?? 10;

  params.set("page", String(page - 1)); // backend is 0-based
  params.set("size", String(size));
  if (query.tab) params.set("tab", query.tab);
  if (query.reviewerId) params.set("reviewerId", query.reviewerId);
  if (query.domain) params.set("domain", query.domain);
  if (query.search) params.set("search", query.search);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);

  const res = await apiClient.get<{
    items: ReviewManagementItem[];
    pageInfo: {
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
    };
  }>(`/business-admin/review-management?${params.toString()}`);

  const pageInfo = res.data.pageInfo || {
    page: page - 1,
    size,
    totalElements: 0,
    totalPages: 0,
  };

  return {
    items: res.data.items || [],
    total: pageInfo.totalElements || 0,
    page: (pageInfo.page ?? 0) + 1,
    size: pageInfo.size || size,
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

