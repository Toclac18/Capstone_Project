import { BaseEntity } from './base';
import { Reader } from './reader';
import { Document } from './document';

export interface ReaderLibrary extends BaseEntity {
  id: number;
  reader: Reader;
  document: Document;
  addedAt: string;
}

