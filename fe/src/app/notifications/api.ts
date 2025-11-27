// src/app/notifications/api.ts
import {
  getNotifications as getNotificationsService,
  getUnreadCount as getUnreadCountService,
  markNotificationAsRead as markNotificationAsReadService,
  type Notification,
  type PagedNotificationResponse,
} from "@/services/notification.service";

export type { Notification, PagedNotificationResponse };

export async function getNotifications(
  options?: { unreadOnly?: boolean; page?: number; size?: number; sort?: string }
): Promise<PagedNotificationResponse> {
  return getNotificationsService(options);
}

export async function getUnreadCount(): Promise<number> {
  return getUnreadCountService();
}

export async function markNotificationAsRead(id: string): Promise<void> {
  return markNotificationAsReadService(id);
}
