"use client";

import { useState, useCallback } from "react";
import { X, CheckCircle } from "lucide-react";
import type { ReviewRequest } from "../api";
import { Spinner } from "@/components/ui/spinner";
import styles from "../styles.module.css";

interface AcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ReviewRequest | null;
  onAccept: (requestId: string) => Promise<void>;
}

export function AcceptModal({
  isOpen,
  onClose,
  request,
  onAccept,
}: AcceptModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = useCallback(async () => {
    if (!request) return;
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await onAccept(request.id);
      onClose();
    } catch (error) {
      console.error("Failed to accept request:", error);
    } finally {
      setIsLoading(false);
    }
  }, [request?.id, onAccept, onClose]);

  if (!isOpen || !request) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={onClose} />
      <div className={styles["modal-container-md"]}>
        <div className={styles["modal-card"]}>
          {/* Header */}
          <div className={styles["modal-header"]}>
            <div className={styles["modal-header-left"]}>
              <div className={`${styles["modal-icon-wrapper"]} ${styles["modal-icon-wrapper-green"]}`}>
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className={styles["modal-title"]}>Accept Review Request</h3>
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
              Are you sure you want to accept the review request for this document?
              Once accepted, the document status will change to &quot;Reviewing&quot; and you will be able to take action on it.
            </p>
            
            <div className={styles["modal-info-section"]}>
              <div className={styles["modal-info-item"]}>
                <span className={styles["modal-info-label"]}>Document:</span>
                <span className={styles["modal-info-value"]}>{request.documentTitle}</span>
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
              onClick={handleAccept}
              disabled={isLoading}
              className={styles["modal-button-accept"]}
            >
              {isLoading ? (
                <>
                  <Spinner size="md" className="mr-2" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Accept Request
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

