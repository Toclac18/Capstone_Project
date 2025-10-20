import { BaseEntity } from './base';

export interface Reviewer extends BaseEntity {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  ordid?: string;
  active: boolean;
  deleted: boolean;
}

