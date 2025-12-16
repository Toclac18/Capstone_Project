import { apiClient } from "@/services/http";

export type ReviewResultStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ReviewDecision = "APPROVED" | "REJECTED";

export type ReviewerInfo = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

export type UploaderInfo = {
  id: string;
  fullName: string;
  email: string;
};

export type DocTypeInfo = {
  id: string;
  code: number;
  name: string;
};

export type DomainInfo = {
  id: string;
  code: number;
  name: string;
};

export type SpecializationInfo = {
  id: string;
  code: number;
  name: string;
};

export type TagInfo = {
  id: string;
  code: number;
  name: string;
};

export type DocumentInfo = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  docType: DocTypeInfo;
  domain: DomainInfo;
  specialization: SpecializationInfo;
  tags: TagInfo[];
};

export type ApprovalInfo = {
  approvedById: string;
  approvedByName: string;
  approvedAt: string;
  rejectionReason: string | null;
};

export type ReviewResult = {
  id: string;
  reviewRequestId: string;
  document: DocumentInfo;
  reviewer: ReviewerInfo;
  uploader: UploaderInfo;
  report: string;
  reportFileUrl: string | null;
  decision: ReviewDecision;
  status: ReviewResultStatus;
  submittedAt: string;
  approval: ApprovalInfo | null;
  createdAt: string;
  updatedAt: string;
};

export type PageInfo = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ReviewResultsResponse = {
  data: ReviewResult[];
  pageInfo: PageInfo;
};

export type ApproveReviewResultRequest = {
  approved: boolean;
  rejectionReason?: string;
};

// Fetch all review results with optional status filter
export async function fetchReviewResults(params: {
  page?: number;
  size?: number;
  status?: ReviewResultStatus | null;
}): Promise<ReviewResultsResponse> {
  const { page = 0, size = 10, status } = params;
  let url = `/business-admin/review-results?page=${page}&size=${size}`;
  if (status) {
    url += `&status=${status}`;
  }
  const res = await apiClient.get<ReviewResultsResponse>(url);
  return res.data;
}

// Fetch pending review results
export async function fetchPendingReviewResults(params: {
  page?: number;
  size?: number;
}): Promise<ReviewResultsResponse> {
  const { page = 0, size = 10 } = params;
  const res = await apiClient.get<ReviewResultsResponse>(
    `/business-admin/review-results/pending?page=${page}&size=${size}`,
  );
  return res.data;
}

// Approve or reject a review result
export async function approveReviewResult(
  reviewId: string,
  request: ApproveReviewResultRequest,
): Promise<ReviewResult> {
  const res = await apiClient.put<{ data: ReviewResult }>(
    `/business-admin/review-results/${reviewId}/approve`,
    request,
  );
  return res.data.data;
}
