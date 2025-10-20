import { BaseEntity } from './base';
import { Reader } from './reader';
import { Document } from './document';

export interface Vote extends BaseEntity {
  id: number;
  reader: Reader;
  document: Document;
  isUpvote: boolean;
}

