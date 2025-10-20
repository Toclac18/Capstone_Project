import { BaseEntity } from './base';
import { Document } from './document';

export interface DocumentTag extends BaseEntity {
  id: number;
  documents: Document[];
}

