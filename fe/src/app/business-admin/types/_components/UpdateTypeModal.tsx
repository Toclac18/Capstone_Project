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
  onUpdate: (id: string, name: string) => Promise<void>;
}

export function UpdateTypeModal({
  isOpen,
  onClose,
  type,
  onUpdate,
}: UpdateTypeModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (type) {
      setName(type.name);
      setError(null);
    }
  }, [type]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!type) return;
      setError(null);

      if (!name.trim()) {
        setError("Type name cannot be empty.");
        return;
      }

      try {
        setIsLoading(true);
        await onUpdate(type.id, name.trim());
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
    [type, name, onUpdate, onClose, showToast]
  );

  const handleClose = useCallback(() => {
    if (isLoading) return;
    if (type) {
      setName(type.name);
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
                onChange={(e) => setName(e.target.value)}
                className={styles["form-input"]}
                placeholder="Enter type name"
                disabled={isLoading}
                autoFocus
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

