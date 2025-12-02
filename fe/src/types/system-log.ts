export type LogAction =
  | "USER_LOGIN_SUCCESS"
  | "USER_LOGIN_FAILED"
  | "USER_LOGOUT"
  | "PASSWORD_CHANGED"
  | "EMAIL_CHANGED"
  | "ROLE_CHANGED"
  | "USER_STATUS_CHANGED"
  | "SYSTEM_CONFIG_UPDATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DELETED"
  | "REVIEWER_APPROVED"
  | "ORGANIZATION_APPROVED";

export interface SystemLog {
  id: string;
  action: LogAction;
  userId: string | null;
  userRole: string | null;
  targetUserId: string | null;
  targetResourceType: string | null;
  targetResourceId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  requestPath: string | null;
  statusCode: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface SystemLogQueryParams {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  targetUserId?: string;
  userRole?: string;
  ipAddress?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SystemLogListResponse {
  logs: SystemLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

