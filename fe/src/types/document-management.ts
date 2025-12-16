import { BaseEntity } from './base';

// Document Uploader Info (for list and detail)
export interface DocumentUploaderInfo {
  id: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  email?: string; // Only in detail
  status?: string; // Only in detail
}

// Document Organization Info (for list and detail)
export interface DocumentOrganizationInfo {
  id: string;
  name: string;
  logo?: string;
  type?: string; // Only in detail
  email?: string; // Only in detail
  status?: string; // Only in detail
}

// Document Type Info
export interface DocumentTypeInfo {
  id: string;
  name: string;
}

// Document Specialization Info
export interface DocumentSpecializationInfo {
  id: string;
  code: number;
  name: string;
  domain?: {
    id: string;
    code: number;
    name: string;
  };
}

// Document Tag Info
export interface DocumentTagInfo {
  id: string;
  name?: string | null;
}

// Document Reviewer Info (only for premium documents)
export interface DocumentReviewerInfo {
  id: string;
  fullName: string;
  username: string;
  email: string;
}

// Review Status Info (for premium documents)
export interface ReviewStatusInfo {
  pendingCount: number;
  acceptedCount: number;
  completedCount: number;
  rejectedCount: number;
  expiredCount: number;
  hasActiveReview: boolean;
}

// Document List Item
export interface DocumentListItem {
  id: string;
  title: string;
  status: string;  // DocStatus enum
  visibility: string;  // DocVisibility enum (PUBLIC/PRIVATE)
  isPremium: boolean;
  price?: number | null;
  thumbnailUrl?: string | null;
  viewCount: number;
  upvoteCount: number;
  voteScore: number;
  createdAt: string;
  updatedAt: string;
  uploader: DocumentUploaderInfo;
  organization?: DocumentOrganizationInfo | null;
  docTypeName: string;
  specializationName: string;
  // Additional linked information
  commentCount?: number;
  saveCount?: number;
  reportCount?: number;
  purchaseCount?: number | null;  // Only for premium documents
  reviewStatus?: ReviewStatusInfo | null;  // Only for premium documents
  // For backward compatibility (computed from visibility)
  isPublic?: boolean;  // true if visibility === "PUBLIC"
}

// Review Request Info
export interface ReviewRequestInfo {
  id: string;
  reviewer: {
    id: string;
    email: string;
    fullName: string;
  };
  assignedBy: {
    id: string;
    email: string;
    fullName: string;
  };
  status: string;  // ReviewRequestStatus
  responseDeadline?: string | null;
  reviewDeadline?: string | null;
  respondedAt?: string | null;
  rejectionReason?: string | null;
  note?: string | null;
  createdAt: string;
}

// Report Info
export interface ReportInfo {
  id: string;
  reporter: {
    id: string;
    email: string;
    fullName: string;
  };
  reason: string;  // ReportReason
  description?: string | null;
  status: string;  // ReportStatus
  adminNotes?: string | null;
  createdAt: string;
}

// Admin Info (only in detail for admin)
export interface AdminInfo {
  commentCount: number;
  saveCount: number;
  reportCount: number;
  purchaseCount?: number | null;
  reviewRequestSummary?: {
    pendingCount: number;
    acceptedCount: number;
    completedCount: number;
    rejectedCount: number;
    expiredCount: number;
    hasActiveReview: boolean;
  } | null;
  reviewRequests?: ReviewRequestInfo[];
  reports?: ReportInfo[];
}

// Document Detail
export interface DocumentDetail extends BaseEntity {
  id: string;
  title: string;
  description?: string | null;
  visibility: string;  // DocVisibility enum (PUBLIC/PRIVATE)
  status: string;  // DocStatus enum
  isPremium: boolean;
  price?: number | null;
  thumbnailUrl?: string | null;
  presignedUrl?: string | null;
  pageCount: number;
  viewCount: number;
  upvoteCount: number;
  downvoteCount: number;
  voteScore: number;
  createdAt: string;
  updatedAt: string;
  // For backward compatibility (computed from visibility)
  isPublic?: boolean;  // true if visibility === "PUBLIC"
  summarizations?: {
    shortSummary?: string | null;
    mediumSummary?: string | null;
    detailedSummary?: string | null;
  } | null;
  uploader: DocumentUploaderInfo;
  organization?: DocumentOrganizationInfo | null;
  docType: {
    id: string;
    name: string;
    description?: string | null;
  };
  specialization: {
    id: string;
    name: string;
    domain: {
      id: string;
      name: string;
    };
  };
  tags: DocumentTagInfo[];
  userInfo?: {
    hasAccess: boolean;
    isUploader: boolean;
    hasRedeemed: boolean;
    isMemberOfOrganization: boolean;
    isReviewer: boolean;
  } | null;
  adminInfo?: AdminInfo | null;  // Only populated for admin requests
}

// Query Parameters
export interface DocumentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: string;
  typeId?: string;
  isPublic?: boolean;
  isPremium?: boolean;
  status?: string; // DocStatus enum: AI_VERIFYING, PENDING_REVIEW, AI_REJECTED, REVIEWING, PENDING_APPROVE, ACTIVE, REJECTED, INACTIVE, DELETED
  deleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string; // ISO date string (YYYY-MM-DD)
  dateTo?: string; // ISO date string (YYYY-MM-DD)
}

// Response
export interface DocumentListResponse {
  documents: DocumentListItem[];
  total: number;
  page: number;
  limit: number;
}

// Document Statistics
export interface DocumentStatistics {
  totalDocuments: number;
  totalActiveDocuments: number;
  totalPremiumDocuments: number;
  totalPublicDocuments: number;
  statusBreakdown: Record<string, number>;
  visibilityBreakdown: Record<string, number>;
  totalViews: number;
  totalComments: number;
  totalSaves: number;
  totalVotes: number;
  totalReports: number;
  totalPurchases: number;
  totalReviewRequests: number;
  pendingReviewRequests: number;
  acceptedReviewRequests: number;
  completedReviews: number;
  documentsUploadedLast30Days: number;
  documentsActivatedLast30Days: number;
}

