import { BaseEntity } from './base';
import { ReaderStatus } from './enums';

export interface Reader extends BaseEntity {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  coinBalance: number;
  status: ReaderStatus;
  deleted?: boolean;
}

