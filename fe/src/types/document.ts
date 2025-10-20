import { BaseEntity } from './base';
import { Reader } from './reader';
import { Organization } from './organization';
import { DocumentType } from './document-type';
import { DocumentCategory } from './document-category';

export interface Document extends BaseEntity {
  id: number;
  title: string;
  description?: string;
  uploader: Reader;
  organization: Organization;
  type: DocumentType;
  categories: DocumentCategory[];
  isPublic?: boolean;
  isPremium?: boolean;
  price?: number;
  viewCount?: number;
  file_name?: string;
  deleted?: boolean;
}

