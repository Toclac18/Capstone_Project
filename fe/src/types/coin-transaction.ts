import { BaseEntity } from './base';
import { Reader } from './reader';
import { Document } from './document';

export interface CoinTransaction extends BaseEntity {
  id: number;
  reader: Reader;
  type: string;
  document: Document;
  amount: number;
}

