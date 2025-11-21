import { BaseEntity } from './base';
import { Reader } from './reader';
import { Organization } from './organization';

export interface Enrollment extends BaseEntity {
  id: number;
  reporter: Reader;
  organization: Organization;
  addedAt: string;
}

