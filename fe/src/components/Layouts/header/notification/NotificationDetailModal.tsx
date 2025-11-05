"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { BellIcon } from "./icons";
import { cn } from "@/utils/utils";
import styles from "./NotificationDetailModal.module.css";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

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

const getTypeLabel = (type: string) => {
  switch (type) {
    case "DOCUMENT_APPROVAL":
      return "Document Approval";
    case "COMMENT":
      return "Comment";
    case "TAG_APPROVAL":
      return "Tag Approval";
    case "PURCHASE":
      return "Purchase";
    case "SYSTEM_UPDATE":
      return "System Update";
    case "REVIEW_REQUEST":
      return "Review Request";
    case "REVIEW_ASSIGNED":
      return "Review Assigned";
    case "REVIEW_COMPLETED":
      return "Review Completed";
    case "ORGANIZATION_INVITATION":
      return "Organization Invitation";
    case "ORGANIZATION_MEMBER_ADDED":
      return "Member Added";
    case "ORGANIZATION_DOCUMENT_SUBMITTED":
      return "Document Submitted";
    default:
      return "Notification";
  }
};

interface Notification {
  id: string;
  type: string;
  title: string;
  summary: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationDetailModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
}: NotificationDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !notification) return null;

  return createPortal(
    <div className={styles.modalContainer}>
      {/* Backdrop */}
      <div
        className={styles.modalBackdrop}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            {/* Type indicator */}
            <div
              className={cn(
                styles.typeIndicator,
                getTypeColor(notification.type)
              )}
            >
              <BellIcon className={styles.typeIcon} />
            </div>
            <div className={styles.modalHeaderInfo}>
              <h3 className={styles.modalTitle}>
                {notification.title}
              </h3>
              <p className={styles.modalTypeLabel}>
                {getTypeLabel(notification.type)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles.modalCloseButton}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalBody}>
          {/* Timestamp and status */}
          <div className={styles.timestampRow}>
            <div className={styles.timestampInfo}>
              <span>{dayjs(notification.timestamp).format("MMM DD, YYYY HH:mm")}</span>
              <span>•</span>
              <span>{dayjs(notification.timestamp).fromNow()}</span>
            </div>
            {!notification.isRead && (
              <span className={styles.unreadBadge}>
                <span className={styles.unreadDot}></span>
                Unread
              </span>
            )}
          </div>

          {/* Summary */}
          <div className={styles.summaryContainer}>
            <p className={styles.summaryText}>
              {notification.summary}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

