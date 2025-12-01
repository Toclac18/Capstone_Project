// Mock data for system logs
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
  details: string | null; // JSON string
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  requestPath: string | null;
  statusCode: number | null;
  errorMessage: string | null;
  createdAt: string;
}

const generateMockLogs = (): SystemLog[] => {
  const actions: LogAction[] = [
    "USER_LOGIN_SUCCESS",
    "USER_LOGIN_FAILED",
    "USER_LOGOUT",
    "PASSWORD_CHANGED",
    "EMAIL_CHANGED",
    "ROLE_CHANGED",
    "USER_STATUS_CHANGED",
    "SYSTEM_CONFIG_UPDATED",
    "DOCUMENT_UPLOADED",
    "DOCUMENT_DELETED",
    "REVIEWER_APPROVED",
    "ORGANIZATION_APPROVED",
  ];

  const userRoles = ["SYSTEM_ADMIN", "BUSINESS_ADMIN", "ORGANIZATION_ADMIN", "REVIEWER", "READER"];
  const ips = ["192.168.1.1", "10.0.0.1", "172.16.0.1", "203.0.113.1", "198.51.100.1"];
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  ];

  const logs: SystemLog[] = [];
  const now = Date.now();

  for (let i = 0; i < 150; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const userId = Math.random() > 0.1 ? `user-${Math.floor(Math.random() * 50) + 1}` : null;
    const userRole = userId ? userRoles[Math.floor(Math.random() * userRoles.length)] : null;
    const targetUserId = Math.random() > 0.7 ? `user-${Math.floor(Math.random() * 50) + 1}` : null;
    
    let details: string | null = null;
    if (action === "ROLE_CHANGED") {
      details = JSON.stringify({
        oldRole: userRoles[Math.floor(Math.random() * userRoles.length)],
        newRole: userRoles[Math.floor(Math.random() * userRoles.length)],
      });
    } else if (action === "USER_STATUS_CHANGED") {
      details = JSON.stringify({
        oldStatus: "ACTIVE",
        newStatus: "INACTIVE",
        reason: "Admin action",
      });
    } else if (action === "SYSTEM_CONFIG_UPDATED") {
      details = JSON.stringify({
        configKey: "max_file_size",
        oldValue: "10MB",
        newValue: "20MB",
      });
    }

    const createdAt = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

    logs.push({
      id: `log-${i + 1}`,
      action,
      userId,
      userRole,
      targetUserId,
      targetResourceType: action.includes("DOCUMENT") ? "DOCUMENT" : action.includes("USER") ? "USER" : null,
      targetResourceId: action.includes("DOCUMENT") ? `doc-${Math.floor(Math.random() * 100)}` : targetUserId,
      details,
      ipAddress: Math.random() > 0.2 ? ips[Math.floor(Math.random() * ips.length)] : null,
      userAgent: Math.random() > 0.3 ? userAgents[Math.floor(Math.random() * userAgents.length)] : null,
      requestMethod: ["GET", "POST", "PUT", "DELETE"][Math.floor(Math.random() * 4)],
      requestPath: `/api/v1/${action.toLowerCase().replace(/_/g, "-")}`,
      statusCode: action === "USER_LOGIN_FAILED" ? 401 : Math.random() > 0.1 ? 200 : 500,
      errorMessage: action === "USER_LOGIN_FAILED" ? "Invalid credentials" : null,
      createdAt,
    });
  }

  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const mockSystemLogs: SystemLog[] = generateMockLogs();

