// src/app/notifications/api.ts
import {
  getNotifications as getNotificationsService,
  markNotificationAsRead as markNotificationAsReadService,
  type Notification,
  type NotificationResponse,
} from "@/services/notification.service";

export type { Notification, NotificationResponse };

export async function getNotifications(): Promise<NotificationResponse> {
  return getNotificationsService();
}

export async function markNotificationAsRead(id: string): Promise<void> {
  return markNotificationAsReadService(id);
}
