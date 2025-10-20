import { BaseEntity } from './base';
import { Reader } from './reader';
import { Document } from './document';

export interface DocumentReport extends BaseEntity {
  id: number;
  reporter: Reader;
  document: Document;
  type: string;
  reportContent: string;
  reportResponse?: string;
  responseAt?: string;
  status: string;
}

