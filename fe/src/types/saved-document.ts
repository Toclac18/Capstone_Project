import { BaseEntity } from './base';
import { Reader } from './reader';
import { Document } from './document';

export interface SavedDocument extends BaseEntity {
  id: number;
  reader: Reader;
  document: Document;
  addedAt: string;
}

