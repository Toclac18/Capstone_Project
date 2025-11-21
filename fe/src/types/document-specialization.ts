import { BaseEntity } from './base';

export interface Specialization extends BaseEntity {
  id: string;
  name: string;
  domainId: string;
}

export interface SpecializationQueryParams {
  domainId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface SpecializationResponse {
  specializations: Specialization[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSpecializationRequest {
  name: string;
  domainId: string;
}

export interface UpdateSpecializationRequest {
  name?: string;
}

