"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  type PagedNotificationResponse,
} from "./api";
import { NotificationDetailModal } from "@/components/layouts/header/notification/NotificationDetailModal";
import { useNotificationEvents, type NotificationEvent } from "@/hooks/useNotificationEvents";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { BellIcon } from "@/components/layouts/header/notification/icons";
import { cn } from "@/utils/utils";
import { Pagination } from "@/components/ui/pagination";
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
    case "ERROR":
      return "bg-red-500";
    case "SUCCESS":
      return "bg-green-500";
    case "DOCUMENT":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

export default function NotificationView() {
  const [data, setData] = useState<PagedNotificationResponse | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchNotificationsInitial = async (page: number = currentPage, unreadFilter: boolean = unreadOnly) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getNotifications({
        unreadOnly: unreadFilter,
        page: page - 1,
        size: pageSize,
        sort: "createdAt,desc",
      });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationsBackground = async (page: number = currentPage, unreadFilter: boolean = unreadOnly) => {
    setError(null);
    try {
      const result = await getNotifications({
        unreadOnly: unreadFilter,
        page: page - 1,
        size: pageSize,
        sort: "createdAt,desc",
      });
      setData(result);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      console.error("Failed to fetch unread count:", e);
    }
  };

  const currentPageRef = useRef(currentPage);
  const unreadOnlyRef = useRef(unreadOnly);
  
  useEffect(() => {
    currentPageRef.current = currentPage;
    unreadOnlyRef.current = unreadOnly;
  }, [currentPage, unreadOnly]);

  const handleNotificationEvent = useCallback((event: NotificationEvent) => {
    switch (event.type) {
      case "new": {
        const newNotif = event.data;
        
        if (currentPageRef.current === 1) {
          setData((prev) => {
            if (!prev) {
              return {
                content: [newNotif],
                totalElements: 1,
                totalPages: 1,
                size: 20,
                number: 0,
                first: true,
                last: true,
              };
            }
            
            const content = prev.content || [];
            
            if (content.some((n) => n.id === newNotif.id)) {
              return prev;
            }
            
            if (unreadOnlyRef.current && newNotif.isRead) {
              return prev;
            }
            
            return {
              ...prev,
              content: [newNotif, ...content],
              totalElements: (prev.totalElements || 0) + 1,
            };
          });
        }
        break;
      }

      case "unread-count":
        if (event.data?.count !== undefined) {
          setUnreadCount(event.data.count);
        }
        break;

      case "updated": {
        const updatedNotif = event.data;
        
        setData((prev) => {
          if (!prev) return prev;
          
          const isUnreadFilter = unreadOnlyRef.current;
          const existsInList = prev.content.some((n) => n.id === updatedNotif.id);
          
          if (isUnreadFilter && updatedNotif.isRead) {
            return {
              ...prev,
              content: prev.content.filter((n) => n.id !== updatedNotif.id),
              totalElements: Math.max(0, prev.totalElements - 1),
            };
          }
          
          if (existsInList) {
            return {
              ...prev,
              content: prev.content.map((n) =>
                n.id === updatedNotif.id ? updatedNotif : n,
              ),
            };
          }
          
          return prev;
        });
        break;
      }
    }
  }, []);

  useNotificationEvents(handleNotificationEvent, true);

  useEffect(() => {
    fetchNotificationsInitial(currentPage, unreadOnly);
    fetchUnreadCount();

    const pollInterval = setInterval(() => {
      if (!loading) {
        fetchNotificationsBackground(currentPage, unreadOnly);
        fetchUnreadCount();
      }
    }, 30000);

    const handleFocus = () => {
      if (!loading) {
        fetchNotificationsBackground(currentPage, unreadOnly);
        fetchUnreadCount();
      }
    };
    window.addEventListener("focus", handleFocus);

    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        fetchNotificationsBackground(currentPage, unreadOnly);
        fetchUnreadCount();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentPage, unreadOnly]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;

    setData((prev) => {
      if (!prev) return prev;
      if (unreadOnly) {
        return {
          ...prev,
          content: prev.content.filter((n) => n.id !== id),
          totalElements: Math.max(0, prev.totalElements - 1),
        };
      }
      return {
        ...prev,
        content: prev.content.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
      };
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(id);
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
      await fetchNotificationsBackground(currentPage, unreadOnly);
      await fetchUnreadCount();
    }
  };

  const handleNotificationClick = (notif: any) => {
    setSelectedNotification(notif);
    setIsModalOpen(true);
    handleMarkAsRead(notif.id, notif.isRead);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (unread: boolean) => {
    setUnreadOnly(unread);
    setCurrentPage(1); // Reset to first page when changing filter
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

  if (!data || !Array.isArray(data.content) || data.content.length === 0) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Notifications</h2>
          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount} new</span>
          )}
        </div>

        <div className="mb-6 flex gap-2 border-b border-stroke dark:border-stroke-dark">
          <button
            onClick={() => handleFilterChange(false)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              !unreadOnly
                ? "border-b-2 border-primary text-primary"
                : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            )}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange(true)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              unreadOnly
                ? "border-b-2 border-primary text-primary"
                : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
            )}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        <div className={styles.emptyContainer}>
          <BellIcon className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>
            {unreadOnly ? "No unread notifications" : "No notifications"}
          </p>
          <p className={styles.emptySubtitle}>
            {unreadOnly ? "You're all caught up!" : "You don't have any notifications yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Notifications</h2>
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount} new</span>
        )}
      </div>

      <div className="mb-6 flex gap-2 border-b border-stroke dark:border-stroke-dark">
        <button
          onClick={() => handleFilterChange(false)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            !unreadOnly
              ? "border-b-2 border-primary text-primary"
              : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
          )}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange(true)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            unreadOnly
              ? "border-b-2 border-primary text-primary"
              : "text-dark-6 hover:text-dark dark:text-dark-6 dark:hover:text-white"
          )}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      <div className={styles.notificationsContainer}>
        {data.content.map((notif) => (
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

      {data.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={data.totalPages}
          totalItems={data.totalElements}
          itemsPerPage={pageSize}
          onPageChange={handlePageChange}
          loading={loading}
        />
      )}

      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
