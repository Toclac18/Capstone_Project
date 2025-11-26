"use client";

import { useEffect, useState } from "react";
import {
  getNotifications,
  markNotificationAsRead,
  type NotificationResponse,
} from "./api";
import { NotificationDetailModal } from "@/components/layouts/header/notification/NotificationDetailModal";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { BellIcon } from "@/components/layouts/header/notification/icons";
import { cn } from "@/utils/utils";
import styles from "./NotificationView.module.css";

dayjs.extend(relativeTime);

const getTypeColor = (type: string) => {
  switch (type) {
    case "DOCUMENT_APPROVAL":
      return "bg-blue-500";
    case "COMMENT":
      return "bg-green-500";
    case "TAG_APPROVAL":
      return "bg-purple-500";
    case "PURCHASE":
      return "bg-yellow-500";
    case "SYSTEM_UPDATE":
      return "bg-gray-500";
    case "REVIEW_REQUEST":
      return "bg-orange-500";
    case "REVIEW_ASSIGNED":
      return "bg-indigo-500";
    case "REVIEW_COMPLETED":
      return "bg-teal-500";
    case "ORGANIZATION_INVITATION":
      return "bg-pink-500";
    case "ORGANIZATION_MEMBER_ADDED":
      return "bg-cyan-500";
    case "ORGANIZATION_DOCUMENT_SUBMITTED":
      return "bg-amber-500";
    default:
      return "bg-gray-500";
  }
};

export default function NotificationView() {
  const [data, setData] = useState<NotificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getNotifications();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return; // Already read, no need to update

    try {
      await markNotificationAsRead(id);
      // Update local state optimistically
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        };
      });
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const handleNotificationClick = (notif: any) => {
    setSelectedNotification(notif);
    setIsModalOpen(true);
    handleMarkAsRead(notif.id, notif.isRead);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }

  if (!data || data.notifications.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <BellIcon className={styles.emptyIcon} />
        <p className={styles.emptyTitle}>No new notifications</p>
        <p className={styles.emptySubtitle}>You&apos;re all caught up!</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Notifications</h2>
        {data.unreadCount > 0 && (
          <span className={styles.unreadBadge}>{data.unreadCount} new</span>
        )}
      </div>

      <div className={styles.notificationsContainer}>
        {data.notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => handleNotificationClick(notif)}
            className={cn(
              styles.notificationCard,
              notif.isRead
                ? styles.notificationCardRead
                : styles.notificationCardUnread,
            )}
          >
            {/* Type indicator */}
            <div className={cn(styles.typeIndicator, getTypeColor(notif.type))}>
              <div className={styles.typeIndicatorDot}></div>
            </div>

            {/* Content */}
            <div className={styles.notificationContent}>
              <h3
                className={cn(
                  styles.notificationTitle,
                  notif.isRead
                    ? styles.notificationTitleRead
                    : styles.notificationTitleUnread,
                )}
              >
                {notif.title}
              </h3>
              <p className={styles.notificationSummary}>{notif.summary}</p>
              <p className={styles.notificationTimestamp}>
                {dayjs(notif.timestamp).fromNow()}
              </p>
            </div>

            {/* Read/Unread indicator */}
            {!notif.isRead && (
              <div className={styles.unreadDot}>
                <span className={styles.unreadDotIndicator}></span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
