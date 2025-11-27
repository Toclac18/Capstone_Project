import { apiClient } from "./http";

export type NotificationType =
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

export type NotificationResponse = {
  notifications: Notification[];
  total: number;
  unreadCount: number;
};

/**
 * Fetch notifications from backend via Next API (/api/notifications)
 */
export async function getNotifications(): Promise<NotificationResponse> {
  const res = await apiClient.get<NotificationResponse>("/notifications");
  return res.data;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

