import { BaseEntity } from './base';

export interface Organization extends BaseEntity {
  id: number;
  email: string;
  hotline: string;
  logo?: string;
  address?: string;
  status: string;
  adminName?: string;
  adminPassword?: string;
  adminEmail?: string;
  active: boolean;
  deleted: boolean;
}

