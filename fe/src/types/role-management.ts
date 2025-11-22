// Types for role management
import type { User, UserQueryParams, UserResponse } from "./user";

export type { User, UserQueryParams, UserResponse };

export type UserRole = 
  | "READER"
  | "REVIEWER"
  | "ORGANIZATION_ADMIN"
  | "BUSINESS_ADMIN"
  | "SYSTEM_ADMIN";

export interface ChangeRoleRequest {
  role: UserRole;
  reason?: string;
}

export interface ChangeRoleResponse {
  user: User;
  message: string;
}

