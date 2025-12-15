"use client";

import { useState, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface AddTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}

export function AddTagModal({ isOpen, onClose, onAdd }: AddTagModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Validate tag name: only letters, numbers, spaces, and Vietnamese characters
  const validateTagName = (value: string): string | null => {
    if (!value.trim()) {
      return "Tag name cannot be empty.";
    }
    if (value.length > 50) {
      return "Tag name must not exceed 50 characters.";
    }
    // Allow letters (including Vietnamese), numbers, spaces, and hyphens
    const validPattern = /^[\p{L}\p{N}\s-]+$/u;
    if (!validPattern.test(value)) {
      return "Tag name can only contain letters, numbers, spaces, and hyphens.";
    }
    return null;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const validationError = validateTagName(name);
      if (validationError) {
        setError(validationError);
        showToast({ type: "error", title: "Validation Error", message: validationError, duration: 3000 });
        return;
      }

      try {
        setIsLoading(true);
        await onAdd(name.trim());
        setName("");
        onClose();
        showToast({
          type: "success",
          title: "Tag Added",
          message: "Tag added successfully.",
          duration: 3000,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add tag.";
        setError(errorMessage);
        showToast({
          type: "error",
          title: "Add Failed",
          message: errorMessage,
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [name, onAdd, onClose, showToast]
  );

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setName("");
    setError(null);
    onClose();
  }, [isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={handleClose} />
      <div className={styles["modal-container"]}>
        <div className={styles["modal-card"]}>
          {/* Header */}
          <div className={styles["modal-header"]}>
            <div className="flex items-center gap-3">
              <div className={styles["modal-icon-wrapper-primary"]}>
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <h3 className={styles["modal-title"]}>Add Tag</h3>
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
          <form id="addTagForm" onSubmit={handleSubmit} className={styles["modal-content"]}>
            <div className={styles["form-group"]}>
              <label htmlFor="tagName" className={styles["form-label"]}>
                Tag Name <span className={styles["required"]}>*</span>
              </label>
              <input
                id="tagName"
                type="text"
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 50) {
                    setName(value);
                    setError(null);
                  }
                }}
                className={styles["form-input"]}
                placeholder="Enter tag name"
                disabled={isLoading}
                maxLength={50}
                autoFocus
              />
              <p className={styles["form-hint"]}>{name.length}/50 characters</p>
              {error && <p className={styles["form-error"]}>{error}</p>}
            </div>
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
              form="addTagForm"
              className={styles["modal-button-submit"]}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Saving..." : "Add Tag"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

