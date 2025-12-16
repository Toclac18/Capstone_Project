// Services for reviewer review list
import { apiClient } from "./http";

// Types matching backend response
export interface ReviewRequestResponse {
  id: string;
  document: {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    pageCount?: number;
    price?: number;
    docType?: {
      name: string;
    };
    domain?: {
      name: string;
    };
    specialization?: {
      name: string;
    };
    tags?: Array<{
      name: string;
    }>;
  };
  reviewer?: {
    userId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
  assignedBy?: {
    userId: string;
    email: string;
    fullName: string;
  };
  status: string;
  responseDeadline?: string;
  reviewDeadline?: string;
  respondedAt?: string;
  rejectionReason?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Review Result Response (renamed from DocumentReview)
export interface ReviewResultResponse {
  id: string;
  reviewRequestId: string;
  document: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    docType?: {
      name: string;
    };
    domain?: {
      name: string;
    };
    specialization?: {
      name: string;
    };
    tags?: Array<{
      name: string;
    }>;
  };
  reviewer?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  uploader?: {
    id: string;
    fullName: string;
    email: string;
  };
  report?: string;
  reportFileUrl?: string;
  decision: "APPROVED" | "REJECTED";
  status: "PENDING" | "APPROVED" | "REJECTED"; // BA approval status
  submittedAt: string;
  approval?: {
    approvedById?: string;
    approvedByName?: string;
    approvedAt?: string;
    rejectionReason?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Alias for backward compatibility
export type DocumentReviewResponse = ReviewResultResponse;

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Backend response structure (PagedResponse from backend)
interface BackendPagedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pageInfo: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first?: boolean;
    last?: boolean;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
  timestamp?: string;
}

// Helper to transform backend PagedResponse to frontend format
function transformPagedResponse<T>(backendRes: BackendPagedResponse<T>): PagedResponse<T> {
  return {
    content: backendRes.data || [],
    page: backendRes.pageInfo?.page ?? 0,
    size: backendRes.pageInfo?.size ?? 10,
    totalElements: backendRes.pageInfo?.totalElements ?? 0,
    totalPages: backendRes.pageInfo?.totalPages ?? 0,
  };
}

// Helper function to map ReviewRequestResponse to frontend ReviewRequest type
function mapReviewRequestToFrontend(req: ReviewRequestResponse): any {
  return {
    id: req.id,
    documentId: req.document.id,
    documentTitle: req.document.title,
    description: req.document.description,
    uploaderName: req.assignedBy?.fullName || "Unknown",
    uploaderId: req.assignedBy?.userId || "",
    uploadedDate: req.createdAt || "",
    documentType: req.document.docType?.name || "",
    domain: req.document.domain?.name || "",
    specialization: req.document.specialization?.name || "",
    tags: req.document.tags?.slice(0, 3).map(t => t.name) || [],
    inviteDate: req.createdAt || "",
    responseDeadline: req.responseDeadline,
  };
}

// Helper function to map ReviewRequestResponse to frontend ReviewDocument type
function mapReviewRequestToDocument(req: ReviewRequestResponse): any {
  return {
    id: req.document.id,
    reviewRequestId: req.id,
    documentTitle: req.document.title,
    description: req.document.description,
    uploaderName: req.assignedBy?.fullName || "Unknown",
    uploaderId: req.assignedBy?.userId || "",
    uploadedDate: req.createdAt || "",
    documentType: req.document.docType?.name || "",
    domain: req.document.domain?.name || "",
    specialization: req.document.specialization?.name || "",
    tags: req.document.tags?.slice(0, 3).map(t => t.name) || [],
    status: "PENDING",
    reviewRequestDate: req.createdAt || "",
    reviewDeadline: req.reviewDeadline,
    fileUrl: (req.document as any).fileUrl, // Document file URL
  };
}

// Helper function to map ReviewResultResponse to frontend ReviewHistory type
function mapReviewResultToHistory(review: ReviewResultResponse): any {
  return {
    id: review.id,
    documentId: review.document.id,
    documentTitle: review.document.title,
    documentType: review.document.docType?.name,
    domain: review.document.domain?.name,
    specialization: review.document.specialization?.name,
    tags: review.document.tags?.slice(0, 3).map(t => t.name) || [],
    uploaderName: review.uploader?.fullName,
    uploadedDate: review.createdAt,
    reviewDate: review.submittedAt,
    action: review.decision === "APPROVED" ? "APPROVE" : "REJECT",
    verificationTime: review.submittedAt,
    reviewerId: review.reviewer?.id || "",
    reviewerName: review.reviewer?.fullName || "",
    comments: review.report,
    // File URLs
    fileUrl: (review.document as any).fileUrl, // Document file URL
    reportFileUrl: review.reportFileUrl, // Review report file URL
    // BA approval status
    baApprovalStatus: review.status, // PENDING, APPROVED, REJECTED
    baApproval: review.approval ? {
      approvedById: review.approval.approvedById,
      approvedByName: review.approval.approvedByName,
      approvedAt: review.approval.approvedAt,
      rejectionReason: review.approval.rejectionReason,
    } : undefined,
  };
}

// GET /api/reviewer/review-list/pending -> Get pending review requests
async function getPendingReviewRequests(params?: {
  page?: number;
  size?: number;
}): Promise<PagedResponse<ReviewRequestResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append("page", params.page.toString());
  if (params?.size !== undefined) queryParams.append("size", params.size.toString());

  const res = await apiClient.get<BackendPagedResponse<ReviewRequestResponse>>(
    `/reviewer/review-list/pending${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
  );

  return transformPagedResponse(res.data);
}

// GET /api/reviewer/review-list/todo -> Get to-do documents
async function getTodoDocuments(params?: {
  page?: number;
  size?: number;
}): Promise<PagedResponse<ReviewRequestResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append("page", params.page.toString());
  if (params?.size !== undefined) queryParams.append("size", params.size.toString());

  const res = await apiClient.get<BackendPagedResponse<ReviewRequestResponse>>(
    `/reviewer/review-list/todo${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
  );

  return transformPagedResponse(res.data);
}

// GET /api/reviewer/review-list/history -> Get review history
async function getReviewHistory(params?: {
  page?: number;
  size?: number;
  decision?: "APPROVED" | "REJECTED";
  dateFrom?: string;
  dateTo?: string;
  docTypeId?: string;
  domainId?: string;
  search?: string;
}): Promise<PagedResponse<ReviewResultResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append("page", params.page.toString());
  if (params?.size !== undefined) queryParams.append("size", params.size.toString());
  if (params?.decision) queryParams.append("decision", params.decision);
  if (params?.dateFrom) queryParams.append("dateFrom", params.dateFrom);
  if (params?.dateTo) queryParams.append("dateTo", params.dateTo);
  if (params?.docTypeId) queryParams.append("docTypeId", params.docTypeId);
  if (params?.domainId) queryParams.append("domainId", params.domainId);
  if (params?.search) queryParams.append("search", params.search);

  const res = await apiClient.get<BackendPagedResponse<ReviewResultResponse>>(
    `/reviewer/review-list/history${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
  );

  return transformPagedResponse(res.data);
}

// PUT /api/reviewer/review-list/requests/[id]/respond -> Respond to review request
async function respondToReviewRequest(
  reviewRequestId: string,
  data: {
    accept: boolean;
    rejectionReason?: string;
  },
): Promise<ReviewRequestResponse> {
  // API route already unwraps ApiResponse, so we get ReviewRequestResponse directly
  const res = await apiClient.put<ReviewRequestResponse>(
    `/reviewer/review-list/requests/${encodeURIComponent(reviewRequestId)}/respond`,
    data,
  );

  return res.data;
}

// PUT /api/reviewer/review-list/[id]/submit -> Submit review
async function submitReviewRequest(
  reviewRequestId: string,
  data: {
    report: string;
    decision: "APPROVED" | "REJECTED";
  },
  reportFile: File,
): Promise<ReviewResultResponse> {
  const formData = new FormData();
  formData.append("request", JSON.stringify(data));
  formData.append("reportFile", reportFile);

  // API route already unwraps ApiResponse, so we get ReviewResultResponse directly
  // Don't set Content-Type header - apiClient will handle it for FormData
  const res = await apiClient.put<ReviewResultResponse>(
    `/reviewer/review-list/${encodeURIComponent(reviewRequestId)}/submit`,
    formData,
  );

  return res.data;
}

// Legacy functions for backward compatibility (mapped to frontend types)
export async function getReviewRequests(params?: {
  page?: number;
  limit?: number;
}): Promise<{ requests: any[]; total: number }> {
  const response = await getPendingReviewRequests({
    page: params?.page ? params.page - 1 : 0,
    size: params?.limit || 10,
  });

  return {
    requests: response.content.map(mapReviewRequestToFrontend),
    total: response.totalElements,
  };
}

export async function getTodoDocumentsLegacy(params?: {
  page?: number;
  limit?: number;
}): Promise<{ documents: any[]; total: number }> {
  const response = await getTodoDocuments({
    page: params?.page ? params.page - 1 : 0,
    size: params?.limit || 10,
  });

  return {
    documents: response.content.map(mapReviewRequestToDocument),
    total: response.totalElements,
  };
}

export async function getReviewedHistory(params?: {
  page?: number;
  limit?: number;
  decision?: "APPROVED" | "REJECTED";
  dateFrom?: string;
  dateTo?: string;
  docTypeId?: string;
  domainId?: string;
  search?: string;
}): Promise<{ reviews: any[]; total: number }> {
  const response = await getReviewHistory({
    page: params?.page ? params.page - 1 : 0,
    size: params?.limit || 10,
    decision: params?.decision,
    dateFrom: params?.dateFrom,
    dateTo: params?.dateTo,
    docTypeId: params?.docTypeId,
    domainId: params?.domainId,
    search: params?.search,
  });

  return {
    reviews: response.content.map(mapReviewResultToHistory),
    total: response.totalElements,
  };
}

export async function approveReviewRequest(
  reviewRequestId: string,
  action: "APPROVE" | "REJECT",
  rejectionReason?: string,
): Promise<any> {
  const response = await respondToReviewRequest(reviewRequestId, {
    accept: action === "APPROVE",
    rejectionReason,
  });
  return mapReviewRequestToFrontend(response);
}

export async function submitReview(
  reviewRequestId: string,
  action: "APPROVE" | "REJECT",
  reportFile: File,
): Promise<any> {
  // Generate a basic report text
  const reportText = `Review ${action === "APPROVE" ? "approved" : "rejected"} by reviewer.`;
  
  const response = await submitReviewRequest(reviewRequestId, {
    report: reportText,
    decision: action === "APPROVE" ? "APPROVED" : "REJECTED",
  }, reportFile);
  
  return mapReviewResultToHistory(response);
}
