import { BaseEntity } from './base';

export interface DocumentType extends BaseEntity {
  id: string;
  code: number;
  name: string;
  description?: string;
}

export interface TypeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface TypeResponse {
  types: DocumentType[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTypeRequest {
  code: number;
  name: string;
  description?: string;
}

export interface UpdateTypeRequest {
  code: number;
  name: string;
  description?: string;
}

