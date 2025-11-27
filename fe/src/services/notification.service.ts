import { apiClient } from "./http";

export type NotificationType =
  | "SYSTEM"
  | "DOCUMENT"
  | "ACCOUNT"
  | "INFO"
  | "WARNING"
  | "SUCCESS"
  | "ERROR"
  | "DOCUMENT_APPROVAL"
  | "COMMENT"
  | "TAG_APPROVAL"
  | "PURCHASE"
  | "SYSTEM_UPDATE"
  | "REVIEW_REQUEST"
  | "REVIEW_ASSIGNED"
  | "REVIEW_COMPLETED"
  | "ORGANIZATION_INVITATION"
  | "ORGANIZATION_MEMBER_ADDED"
  | "ORGANIZATION_DOCUMENT_SUBMITTED";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  summary: string;
  timestamp: string;
  isRead: boolean;
};

export type BackendNotificationResponse = {
  success: boolean;
  data: Notification[];
  pageInfo: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp: string;
};

export type PagedNotificationResponse = {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

export type NotificationResponse = {
  notifications: Notification[];
  total: number;
  unreadCount: number;
};

export type UnreadCountResponse = {
  count: number;
};

export type MarkAllAsReadResponse = {
  count: number;
};

export type GetNotificationsOptions = {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
};

export type CreateNotificationRequest = {
  userId: string;
  type: NotificationType;
  title: string;
  summary: string;
};

/**
 * Fetch notifications from backend via Next API (/api/notifications)
 * Returns paginated response
 */
export async function getNotifications(
  options: GetNotificationsOptions = {}
): Promise<PagedNotificationResponse> {
  const { unreadOnly = false, page = 0, size = 20, sort = "createdAt,desc" } = options;
  
  const params = new URLSearchParams({
    unreadOnly: unreadOnly.toString(),
    page: page.toString(),
    size: size.toString(),
    sort,
  });

  const res = await apiClient.get<PagedNotificationResponse>(
    `/notifications?${params.toString()}`
  );
  return res.data;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<UnreadCountResponse>("/notifications/unread-count");
  return res.data.count;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<number> {
  const res = await apiClient.patch<MarkAllAsReadResponse>("/notifications/read-all");
  return res.data.count;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  request: CreateNotificationRequest
): Promise<Notification> {
  const res = await apiClient.post<Notification>("/notifications", request);
  return res.data;
}

