import { BaseEntity } from './base';
import { Reviewer } from './reviewer';
import { Document } from './document';

export interface ReviewInvite extends BaseEntity {
  id: number;
  reviewer: Reviewer;
  document: Document;
  status: string;
  expiry: string;
}

