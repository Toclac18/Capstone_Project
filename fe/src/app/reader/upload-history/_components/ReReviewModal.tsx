"use client";

import { useState, useEffect } from "react";
import { RefreshCw, X, AlertCircle } from "lucide-react";
import styles from "../styles.module.css";

interface ReReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  documentName: string;
}

export default function ReReviewModal({
  isOpen,
  onClose,
  onSubmit,
  documentName,
}: ReReviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    if (!reason.trim()) {
      setError("Reason is required");
      return false;
    }
    if (reason.trim().length < 10) {
      setError("Reason must be at least 10 characters");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);
      await onSubmit(reason.trim());
      // Don't call onClose() here - let the parent handle it after data refresh
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unable to submit request. Please try again later.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return; // Prevent closing while loading
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={handleClose} />
      <div className={`${styles["modal-container"]} ${styles["modal-container-md"]}`}>
        <div className={styles["modal-card"]}>
          <div className={styles["modal-header"]}>
            <div className={styles["modal-header-left"]}>
              <div className={`${styles["modal-icon-wrapper"]} ${styles["primary"]}`}>
                <RefreshCw className={`${styles["modal-icon"]} ${styles["primary"]}`} />
              </div>
              <div>
                <h3 className={styles["modal-title"]}>Re-review Request</h3>
                <p className={styles["modal-subtitle"]}>{documentName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className={styles["modal-close-btn"]}
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles["modal-form"]}>
            <div className={styles["form-fields"]}>
              <div className={styles["field-group"]}>
                <label className={styles["field-label"]}>
                  Reason <span className={styles["field-label-required"]}>*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Please explain why you are requesting a re-review of this document..."
                  rows={6}
                  className={`${styles["field-textarea"]} ${error ? styles["error"] : ""}`}
                  disabled={isLoading}
                />
                {error && (
                  <div className={styles["field-error"]}>
                    <AlertCircle className={styles["error-icon"]} />
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className={`${styles["modal-actions"]} ${styles["modal-actions-end"]}`}>
              <button
                type="button"
                onClick={handleClose}
                className={styles["btn-cancel"]}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={styles["btn-submit-modal"]}
              >
                {isLoading && (
                  <svg className={styles["spinner"]} fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isLoading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

