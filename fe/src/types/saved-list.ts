import { BaseEntity } from './base';
import { Reader } from './reader';

export interface SavedList extends BaseEntity {
  id: number;
  reader: Reader;
  name: string;
}

