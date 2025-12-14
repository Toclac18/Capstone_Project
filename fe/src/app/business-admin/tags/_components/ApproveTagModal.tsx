"use client";

import { useState, useCallback } from "react";
import { X, CheckCircle } from "lucide-react";
import type { Tag } from "../api";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface ApproveTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null;
  onApprove: (id: string) => Promise<void>;
}

export function ApproveTagModal({
  isOpen,
  onClose,
  tag,
  onApprove,
}: ApproveTagModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleApprove = useCallback(async () => {
    if (!tag) return;

    try {
      setIsLoading(true);
      await onApprove(tag.id);
      onClose();
      showToast({
        type: "success",
        title: "Tag Approved",
        message: "Tag approved successfully.",
        duration: 3000,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to approve tag.";
      showToast({
        type: "error",
        title: "Approve Failed",
        message: errorMessage,
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [tag, onApprove, onClose, showToast]);

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
              <div className={styles["modal-icon-wrapper-green"]}>
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className={styles["modal-title"]}>Approve Tag</h3>
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
              Are you sure you want to approve this tag? It will be changed to Active status.
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
              onClick={handleApprove}
              disabled={isLoading}
              className={styles["modal-button-approve"]}
            >
              {isLoading ? "Approving..." : "Approve Tag"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

