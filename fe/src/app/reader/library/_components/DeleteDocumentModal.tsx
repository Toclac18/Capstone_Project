"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface DeleteDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  documentName: string;
}

export default function DeleteDocumentModal({
  isOpen,
  onClose,
  onDelete,
  documentName,
}: DeleteDocumentModalProps) {
  const { showToast } = useToast();
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

  if (!mounted || !isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onDelete();
      // Parent handles modal close and success toast after data refresh
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Unable to delete document. Please try again later.";
      setError(msg);
      showToast({
        type: "error",
        title: "Error",
        message: msg,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["delete-modal-overlay"]}>
      <div className={styles["delete-modal-backdrop"]} onClick={handleClose} />
      <div className={styles["delete-modal-container"]}>
        <div className={styles["delete-modal-header"]}>
          <h3 className={styles["delete-modal-title"]}>Delete Document</h3>
          <button
            onClick={handleClose}
            className={styles["delete-modal-close-btn"]}
            disabled={isLoading}
          >
            <X className={styles["delete-modal-close-icon"]} />
          </button>
        </div>

        <div className={styles["delete-modal-body"]}>
          <div className={styles["delete-warning-alert"]}>
            <AlertCircle className={styles["delete-warning-icon"]} />
            <p className={styles["delete-warning-message"]}>
              Are you sure you want to delete <strong>&quot;{documentName}&quot;</strong>? This action cannot be undone.
            </p>
          </div>

          {error && (
            <div className={styles["delete-error-alert"]}>
              <AlertCircle className={styles["delete-error-icon"]} />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className={styles["delete-modal-actions"]}>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={styles["delete-btn-cancel"]}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className={styles["delete-btn-delete"]}
          >
            {isLoading ? (
              <>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className={styles["delete-btn-icon"]} />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

