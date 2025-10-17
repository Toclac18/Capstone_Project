// User related interfaces and types

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
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

export interface UserResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}
