import { BaseEntity } from './base';

export interface Organization extends BaseEntity {
  id: string;
  email: string;
  hotline: string;
  logo?: string;
  address?: string;
  status: string;
  adminName?: string;
  adminEmail: string;
  active: boolean;
  deleted: boolean;
  createdAt: string;
  organizationName?: string;
}

export interface OrganizationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface OrganizationResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
}

