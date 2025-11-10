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

// Document List Item
export interface DocumentListItem {
  id: string;
  title: string;
  isPublic: boolean;
  isPremium: boolean;
  viewCount: number;
  deleted: boolean;
  createdAt: string;
  uploader: DocumentUploaderInfo;
  organization?: DocumentOrganizationInfo | null;
  type: DocumentTypeInfo;
}

// Document Detail
export interface DocumentDetail extends BaseEntity {
  id: string;
  title: string;
  description?: string | null;
  file_name?: string | null;
  isPublic: boolean;
  isPremium: boolean;
  price?: number | null;
  viewCount: number;
  deleted: boolean;
  uploader: DocumentUploaderInfo;
  organization?: DocumentOrganizationInfo | null;
  type: DocumentTypeInfo;
  specializations: DocumentSpecializationInfo[];
  tags: DocumentTagInfo[];
  commentCount: number;
  saveCount: number;
  upvoteCount: number;
  downvoteCount: number;
  reportCount: number;
  purchaseCount?: number | null; // Only if isPremium = true
  reviewer?: DocumentReviewerInfo | null; // Only if isPremium = true and has successful review
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
  deleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

// Response
export interface DocumentListResponse {
  documents: DocumentListItem[];
  total: number;
  page: number;
  limit: number;
}

