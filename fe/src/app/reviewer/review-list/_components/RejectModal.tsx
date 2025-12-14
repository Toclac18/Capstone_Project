"use client";

import { useState, useCallback } from "react";
import { X } from "lucide-react";
import type { ReviewRequest } from "../api";
import { formatDate } from "@/utils/format-date";
import { Spinner } from "@/components/ui/spinner";
import styles from "../styles.module.css";

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ReviewRequest | null;
  onReject: (requestId: string, rejectionReason?: string) => Promise<void>;
}

export function RejectModal({
  isOpen,
  onClose,
  request,
  onReject,
}: RejectModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = useCallback(async () => {
    if (!request) return;
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await onReject(request.id, rejectionReason.trim() || undefined);
      setRejectionReason("");
      onClose();
    } catch (error) {
      console.error("Failed to reject request:", error);
    } finally {
      setIsLoading(false);
    }
  }, [request?.id, rejectionReason, onReject, onClose]);

  if (!isOpen || !request) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={onClose} />
      <div className={styles["modal-container-md"]}>
        <div className={styles["modal-card"]}>
          {/* Header */}
          <div className={styles["modal-header"]}>
            <div className={styles["modal-header-left"]}>
              <div className={`${styles["modal-icon-wrapper"]} ${styles["modal-icon-wrapper-red"]}`}>
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className={styles["modal-title"]}>Reject Review Request</h3>
                <p className={styles["modal-subtitle"]}>{request.documentTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={styles["modal-close-button"]}
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className={styles["modal-content"]}>
            <p className={styles["modal-description"]}>
              Are you sure you want to reject the review request for this document?
              Once rejected, the document will be removed from your review requests list.
            </p>
            
            <div className={styles["modal-info-section"]}>
              <div className={styles["modal-info-item"]}>
                <span className={styles["modal-info-label"]}>Document:</span>
                <span className={styles["modal-info-value"]}>{request.documentTitle}</span>
              </div>
              {request.description && (
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>Description:</span>
                  <span className={styles["modal-info-value"]}>{request.description}</span>
                </div>
              )}
              <div className={styles["modal-info-item"]}>
                <span className={styles["modal-info-label"]}>Uploader:</span>
                <span className={styles["modal-info-value"]}>{request.uploaderName}</span>
              </div>
              <div className={styles["modal-info-item"]}>
                <span className={styles["modal-info-label"]}>Upload Date:</span>
                <span className={styles["modal-info-value"]}>
                  {formatDate(request.uploadedDate)}
                </span>
              </div>
            </div>

            {/* Rejection Reason Input */}
            <div className={styles["modal-form-section"]}>
              <label className={styles["modal-form-label"]}>
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this review request..."
                className={styles["modal-textarea"]}
                rows={4}
                maxLength={1000}
                disabled={isLoading}
              />
              <div className={styles["modal-form-hint"]}>
                {rejectionReason.length}/1000 characters
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles["modal-footer"]}>
            <button
              onClick={onClose}
              className={styles["modal-button-cancel"]}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={isLoading}
              className={styles["modal-button-reject"]}
            >
              {isLoading ? (
                <>
                  <Spinner size="md" className="mr-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Reject Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

