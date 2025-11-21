import { BaseEntity } from './base';
import { Document } from './document';

export interface DocumentCategory extends BaseEntity {
  id: number;
  documents: Document[];
}

