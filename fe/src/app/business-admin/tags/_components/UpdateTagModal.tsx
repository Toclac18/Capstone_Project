"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Edit2 } from "lucide-react";
import type { Tag, TagStatus } from "../api";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface UpdateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null;
  onUpdate: (id: string, name: string, status: TagStatus) => Promise<void>;
}

export function UpdateTagModal({
  isOpen,
  onClose,
  tag,
  onUpdate,
}: UpdateTagModalProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<TagStatus>("ACTIVE");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setStatus(tag.status);
      setError(null);
    }
  }, [tag]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!tag) return;
      setError(null);

      if (!name.trim()) {
        setError("Tag name cannot be empty.");
        return;
      }

      try {
        setIsLoading(true);
        await onUpdate(tag.id, name.trim(), status);
        onClose();
        showToast({
          type: "success",
          title: "Tag Updated",
          message: "Tag updated successfully.",
          duration: 3000,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update tag.";
        setError(errorMessage);
        showToast({
          type: "error",
          title: "Update Failed",
          message: errorMessage,
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [tag, name, status, onUpdate, onClose, showToast]
  );

  const handleClose = useCallback(() => {
    if (isLoading) return;
    if (tag) {
      setName(tag.name);
      setStatus(tag.status);
    }
    setError(null);
    onClose();
  }, [isLoading, tag, onClose]);

  if (!isOpen || !tag) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={handleClose} />
      <div className={styles["modal-container"]}>
        <div className={styles["modal-card"]}>
          {/* Header */}
          <div className={styles["modal-header"]}>
            <div className="flex items-center gap-3">
              <div className={styles["modal-icon-wrapper-primary"]}>
                <Edit2 className="w-5 h-5 text-primary" />
              </div>
              <h3 className={styles["modal-title"]}>Update Tag</h3>
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
          <form id="updateTagForm" onSubmit={handleSubmit} className={styles["modal-content"]}>
            <div className={styles["form-group"]}>
              <label htmlFor="updateTagName" className={styles["form-label"]}>
                Tag Name <span className={styles["required"]}>*</span>
              </label>
              <input
                id="updateTagName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles["form-input"]}
                placeholder="Enter tag name"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className={styles["form-group"]}>
              <label htmlFor="updateTagStatus" className={styles["form-label"]}>
                Status <span className={styles["required"]}>*</span>
              </label>
              <select
                id="updateTagStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as TagStatus)}
                className={styles["form-select"]}
                disabled={isLoading}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {error && <p className={styles["form-error"]}>{error}</p>}
          </form>

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
              type="submit"
              form="updateTagForm"
              className={styles["modal-button-submit"]}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Saving..." : "Update Tag"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

