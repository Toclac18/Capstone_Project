import { BaseEntity } from './base';

export enum OrganizationStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  DEACTIVE = 'DEACTIVE',
  DELETED = 'DELETED'
}

export enum OrganizationType {
  TYPE1 = 'TYPE1',
  TYPE2 = 'TYPE2',
  TYPE3 = 'TYPE3'
}

export interface Organization extends BaseEntity {
  id: string;
  userId?: string; // Admin user ID
  organizationId?: string; // Organization profile ID (for statistics API)
  name: string;
  type: OrganizationType;
  email: string;
  hotline: string;
  logo?: string;
  address: string;
  registrationNumber: string;
  status: OrganizationStatus | string;
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

