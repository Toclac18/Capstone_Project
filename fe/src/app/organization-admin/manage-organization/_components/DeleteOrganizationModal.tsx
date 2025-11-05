"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, X, AlertCircle } from "lucide-react";
import styles from "../styles.module.css";

// Helper function to render spinner
const Spinner = () => (
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
);

interface DeleteOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export default function DeleteOrganizationModal({
  isOpen,
  onClose,
  onDelete,
}: DeleteOrganizationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      await onDelete();
      onClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete organization";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={onClose} />
      <div className={`${styles["modal-container"]} ${styles["modal-container-md"]}`}>
        <div className={`${styles["modal-card"]} ${styles["modal-card-flex"]} ${styles["red-border"]}`}>
          <div className={`${styles["modal-header"]} ${styles["red-border"]}`}>
            <div className={styles["modal-header-left"]}>
              <div className={`${styles["modal-icon-wrapper"]} ${styles["red"]}`}>
                <Trash2 className={`${styles["modal-icon"]} ${styles["red"]}`} />
              </div>
              <div>
                <h3 className={`${styles["modal-title"]} ${styles["red"]}`}>Delete Organization</h3>
                <p className={styles["modal-subtitle"]}>
                  This action will deactivate your organization
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={styles["modal-close-btn"]}
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles["modal-form"]}>
            <div className={styles["warning-alert"]}>
              <div className={styles["warning-content"]}>
                <AlertCircle className={styles["warning-icon"]} />
                <div>
                  <p className={styles["warning-title"]}>
                    Are you sure you want to delete this organization?
                  </p>
                  <p className={styles["warning-text"]}>
                    Your account will be deactivated immediately. Public documents will remain. 
                    You can still reactivate your organization within 7 days after deletion.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className={styles["alert-error"]}>
                <div className={styles["alert-error-content"]}>
                  <AlertCircle className={styles["alert-icon"]} />
                  {error}
                </div>
              </div>
            )}

            <div className={`${styles["modal-actions"]} ${styles["modal-actions-end"]} ${styles["red-border"]}`}>
              <button
                type="button"
                onClick={onClose}
                className={styles["btn-cancel"]}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`${styles["btn-submit"]} ${styles["red"]}`}
              >
                {isLoading && <Spinner />}
                <Trash2 className="w-4 h-4" />
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

