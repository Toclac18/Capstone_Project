import { BaseEntity } from './base';

export interface BusinessAdmin extends BaseEntity {
  id: number;
  email: string;
  passwordHash: string;
  fullName?: string;
  active: boolean;
  deleted: boolean;
}

