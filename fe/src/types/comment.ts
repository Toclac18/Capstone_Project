import { BaseEntity } from './base';
import { Reader } from './reader';
import { Document } from './document';

export interface Comment extends BaseEntity {
  id: number;
  reader: Reader;
  document: Document;
  content: string;
}

