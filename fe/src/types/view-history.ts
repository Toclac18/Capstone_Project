import { BaseEntity } from './base';
import { Reader } from './reader';
import { Document } from './document';

export interface ViewHistory extends BaseEntity {
  id: number;
  reader: Reader;
  document: Document;
  viewAt: string;
}

