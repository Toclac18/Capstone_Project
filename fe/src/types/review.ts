// Types for Reviewer Review List

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "RE_REVIEW_REQUESTED";

export type ReviewAction = "APPROVE" | "REJECT" | "REQUEST_REVIEW";

// Document assigned to reviewer (Todo tab)
export interface ReviewDocument {
  id: string;
  documentTitle: string;
  description?: string;
  uploaderName: string;
  uploaderId: string;
  uploadedDate: string;
  documentType: string;
  domain: string;
  domains?: string[];
  tags?: string[];
  tagIds?: string[];
  status: "PENDING"; // Only PENDING for Todo
  reviewRequestDate?: string;
  specializationId?: string;
  specialization?: string; // Specialization name
}

// Document waiting for reviewer to accept invitation (Request Review tab)
export interface ReviewRequest {
  id: string;
  documentTitle: string;
  description?: string;
  uploaderName: string;
  uploaderId: string;
  uploadedDate: string;
  documentType: string;
  domain: string;
  domains?: string[];
  tags?: string[];
  tagIds?: string[];
  inviteDate: string;
  specializationId?: string;
  specialization?: string; // Specialization name
}

export interface ReviewHistory {
  id: string;
  documentId: string;
  documentTitle: string;
  documentType?: string;
  domain?: string;
  specializationId?: string;
  specialization?: string; // Specialization name
  tags?: string[];
  uploaderName?: string;
  uploadedDate?: string;
  reviewDate: string;
  action: ReviewAction;
  verificationTime?: string;
  reviewerId: string;
  reviewerName: string;
  comments?: string;
}

export interface ReviewListQueryParams {
  page?: number;
  limit?: number;
  status?: ReviewStatus;
  search?: string;
}

export interface ReviewHistoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  domain?: string;
  specialization?: string;
  active?: boolean; // Approved documents
  rejected?: boolean; // Rejected documents
}

export interface ReviewListResponse {
  documents: ReviewDocument[];
  total: number;
}

export interface ReviewRequestsResponse {
  requests: ReviewRequest[];
  total: number;
}

export interface ReviewHistoryResponse {
  reviews: ReviewHistory[];
  total: number;
}

