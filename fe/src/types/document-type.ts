import { BaseEntity } from './base';

export interface DocumentType extends BaseEntity {
  id: string;
  name: string;
  createdDate?: string; // For business admin management, uses createdDate instead of createdAt
}

export interface TypeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "name" | "createdDate" | "id";
  sortOrder?: "asc" | "desc";
}

export interface TypeResponse {
  types: DocumentType[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTypeRequest {
  name: string;
}

export interface UpdateTypeRequest {
  name?: string;
}

