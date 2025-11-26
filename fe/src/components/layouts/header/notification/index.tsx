"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/utils/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BellIcon } from "./icons";
import {
  getNotifications,
  markNotificationAsRead,
} from "@/services/notification.service";
import { NotificationDetailModal } from "./NotificationDetailModal";
import styles from "./styles.module.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications.slice(0, 5)); // Show only latest 5
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Fetch notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return; // Already read, no need to update

    try {
      await markNotificationAsRead(id);
      // Update local state optimistically
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  const handleNotificationClick = (notif: any) => {
    setSelectedNotification(notif);
    setIsModalOpen(true);
    handleMarkAsRead(notif.id, notif.isRead);
    setIsOpen(false);
  };

  const isDotVisible = unreadCount > 0;

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);
      }}
    >
      <DropdownTrigger
        className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />

          {isDotVisible && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent align="end" className={styles.dropdownContent}>
        <div className={styles.dropdownHeader}>
          <span className={styles.dropdownTitle}>Notifications</span>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount} new</span>
          )}
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyContainer}>
            <BellIcon className={styles.emptyIcon} />
            <p className={styles.emptyText}>No new notifications</p>
          </div>
        ) : (
          <ul className={styles.notificationsList}>
            {notifications.map((notif) => (
              <li key={notif.id} role="menuitem">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNotificationClick(notif);
                  }}
                  className={cn(
                    styles.notificationItem,
                    notif.isRead
                      ? styles.notificationItemRead
                      : styles.notificationItemUnread,
                  )}
                >
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitleRow}>
                      <strong
                        className={cn(
                          styles.notificationTitle,
                          notif.isRead
                            ? styles.notificationTitleRead
                            : styles.notificationTitleUnread,
                        )}
                      >
                        {notif.title}
                      </strong>
                      {!notif.isRead && (
                        <span className={styles.unreadDot}></span>
                      )}
                    </div>

                    <span className={styles.notificationTimestamp}>
                      {dayjs(notif.timestamp).fromNow()}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/notifications"
          onClick={() => setIsOpen(false)}
          className={styles.seeAllLink}
        >
          See all notifications
        </Link>
      </DropdownContent>

      {/* Notification Detail Modal */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Dropdown>
  );
}
