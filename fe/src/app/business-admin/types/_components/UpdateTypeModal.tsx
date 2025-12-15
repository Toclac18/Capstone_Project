"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Edit2 } from "lucide-react";
import type { Type } from "../api";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface UpdateTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: Type | null;
  onUpdate: (id: string, code: number, name: string, description?: string) => Promise<void>;
}

export function UpdateTypeModal({
  isOpen,
  onClose,
  type,
  onUpdate,
}: UpdateTypeModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (type) {
      setName(type.name);
      setDescription(type.description || "");
      setError(null);
    }
  }, [type]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!type) return;
      setError(null);

      if (!name.trim()) {
        const msg = "Type name cannot be empty.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      if (name.trim().length < 3 || name.trim().length > 100) {
        const msg = "Type name must be between 3 and 100 characters.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      // Validate special characters
      const validPattern = /^[\p{L}\p{N}\s-]+$/u;
      if (!validPattern.test(name.trim())) {
        const msg = "Type name can only contain letters, numbers, spaces, and hyphens.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      try {
        setIsLoading(true);
        await onUpdate(type.id, type.code, name.trim(), description.trim() || undefined);
        onClose();
        showToast({
          type: "success",
          title: "Type Updated",
          message: "Type updated successfully.",
          duration: 3000,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update type.";
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
    [type, name, description, onUpdate, onClose, showToast]
  );

  const handleClose = useCallback(() => {
    if (isLoading) return;
    if (type) {
      setName(type.name);
      setDescription(type.description || "");
    }
    setError(null);
    onClose();
  }, [isLoading, type, onClose]);

  if (!isOpen || !type) return null;

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
              <h3 className={styles["modal-title"]}>Update Type</h3>
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
          <form id="updateTypeForm" onSubmit={handleSubmit} className={styles["modal-content"]}>
            <div className={styles["form-group"]}>
              <label htmlFor="updateTypeName" className={styles["form-label"]}>
                Type Name <span className={styles["required"]}>*</span>
              </label>
              <input
                id="updateTypeName"
                type="text"
                value={name}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    setName(e.target.value);
                  }
                }}
                className={styles["form-input"]}
                placeholder="Enter type name (3-100 characters)"
                disabled={isLoading}
                maxLength={100}
                autoFocus
              />
              <p className={styles["form-hint"]}>{name.length}/100 characters</p>
            </div>

            <div className={styles["form-group"]}>
              <label htmlFor="updateTypeDescription" className={styles["form-label"]}>
                Description
              </label>
              <textarea
                id="updateTypeDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles["form-input"]}
                placeholder="Enter type description"
                disabled={isLoading}
                rows={4}
              />
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
              form="updateTypeForm"
              className={styles["modal-button-submit"]}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Saving..." : "Update Type"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

