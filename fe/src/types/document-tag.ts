import { BaseEntity } from './base';
import { Document } from './document';

export interface DocumentTag extends BaseEntity {
  id: number;
  documents: Document[];
}

export type TagStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "REJECTED";

export interface Tag {
  id: string;
  name: string;
  status: TagStatus;
  createdDate: string;
}

export interface TagQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TagStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "name" | "createdDate";
  sortOrder?: "asc" | "desc";
}

export interface TagResponse {
  tags: Tag[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTagRequest {
  name: string;
}

export interface UpdateTagRequest {
  name?: string;
  status?: TagStatus;
}

