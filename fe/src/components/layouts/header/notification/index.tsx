"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/utils/utils";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { BellIcon } from "./icons";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
} from "@/services/notification.service";
import { NotificationDetailModal } from "./NotificationDetailModal";
import { useNotificationEvents, type NotificationEvent } from "@/hooks/useNotificationEvents";
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

  const fetchNotificationsInitial = async () => {
    try {
      // Fetch latest 5 notifications
      const data = await getNotifications({
        unreadOnly: false,
        page: 0,
        size: 5,
        sort: "createdAt,desc",
      });
      // Ensure content is always an array
      setNotifications(Array.isArray(data?.content) ? data.content : []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Set empty array on error
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationsBackground = async () => {
    try {
      // Fetch latest 5 notifications
      const data = await getNotifications({
        unreadOnly: false,
        page: 0,
        size: 5,
        sort: "createdAt,desc",
      });
      // Ensure content is always an array
      setNotifications(Array.isArray(data?.content) ? data.content : []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Don't update state on error for background fetch
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const handleNotificationEvent = useCallback((event: NotificationEvent) => {
    switch (event.type) {
      case "new": {
        const newNotif = event.data;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) {
            return prev;
          }
          return [newNotif, ...prev].slice(0, 5);
        });
        break;
      }

      case "unread-count":
        if (event.data?.count !== undefined) {
          setUnreadCount(event.data.count);
        }
        break;

      case "updated": {
        const updatedNotif = event.data;
        setNotifications((prev) =>
          prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
        );
        break;
      }
    }
  }, []);

  useNotificationEvents(handleNotificationEvent, true);

  useEffect(() => {
    fetchNotificationsInitial();
    fetchUnreadCount();

    const fallbackInterval = setInterval(() => {
      fetchNotificationsBackground();
      fetchUnreadCount();
    }, 30000);

    const handleFocus = () => {
      fetchNotificationsBackground();
      fetchUnreadCount();
    };
    window.addEventListener("focus", handleFocus);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotificationsBackground();
        fetchUnreadCount();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(fallbackInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );

    try {
      await markNotificationAsRead(id);
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
      await fetchUnreadCount();
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
        if (open && !loading) {
          fetchNotificationsBackground();
          fetchUnreadCount();
        }
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

      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Dropdown>
  );
}
