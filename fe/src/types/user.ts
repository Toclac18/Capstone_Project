// User related interfaces and types

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
  DEACTIVE = 'DEACTIVE'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: UserStatus | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  email: string;
  name?: string;
  password?: string;
  role?: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

export interface UserResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}
