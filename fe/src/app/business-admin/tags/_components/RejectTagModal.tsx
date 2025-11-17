"use client";

import { useState, useCallback } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { Tag } from "../api";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface RejectTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null;
  onReject: (id: string) => Promise<void>;
}

export function RejectTagModal({
  isOpen,
  onClose,
  tag,
  onReject,
}: RejectTagModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleReject = useCallback(async () => {
    if (!tag) return;

    try {
      setIsLoading(true);
      await onReject(tag.id);
      onClose();
      showToast({
        type: "success",
        title: "Tag Rejected",
        message: "Tag deleted successfully.",
        duration: 3000,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reject tag.";
      showToast({
        type: "error",
        title: "Reject Failed",
        message: errorMessage,
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [tag, onReject, onClose, showToast]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  if (!isOpen || !tag) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={handleClose} />
      <div className={styles["modal-container"]}>
        <div className={styles["modal-card"]}>
          {/* Header */}
          <div className={styles["modal-header"]}>
            <div className="flex items-center gap-3">
              <div className={styles["modal-icon-wrapper-red"]}>
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className={styles["modal-title"]}>Reject Tag</h3>
            </div>
            <button
              onClick={handleClose}
              className={styles["modal-close-button"]}
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className={styles["modal-content"]}>
            <p className={styles["modal-description"]}>
              Are you sure you want to reject and delete this tag? This action cannot be undone.
            </p>

            <div className={styles["modal-info-section"]}>
              <div className={styles["modal-info-item"]}>
                <span className={styles["modal-info-label"]}>Tag ID:</span>
                <span className={styles["modal-info-value"]}>{tag.id}</span>
              </div>
              <div className={styles["modal-info-item"]}>
                <span className={styles["modal-info-label"]}>Tag Name:</span>
                <span className={styles["modal-info-value"]}>{tag.name}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles["modal-footer"]}>
            <button
              type="button"
              onClick={handleClose}
              className={styles["modal-button-cancel"]}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isLoading}
              className={styles["modal-button-reject"]}
            >
              {isLoading ? "Rejecting..." : "Reject Tag"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

