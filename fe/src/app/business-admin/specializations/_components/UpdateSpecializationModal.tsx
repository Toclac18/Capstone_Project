"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Edit2 } from "lucide-react";
import type { Specialization } from "../api";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface UpdateSpecializationModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialization: Specialization | null;
  onUpdate: (id: string, name: string) => Promise<void>;
}

export function UpdateSpecializationModal({
  isOpen,
  onClose,
  specialization,
  onUpdate,
}: UpdateSpecializationModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (specialization) {
      setName(specialization.name);
      setError(null);
    }
  }, [specialization]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!specialization) return;
      setError(null);

      if (!name.trim()) {
        const msg = "Specialization name cannot be empty.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      if (name.trim().length < 3 || name.trim().length > 100) {
        const msg = "Specialization name must be between 3 and 100 characters.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      // Validate special characters
      const validPattern = /^[\p{L}\p{N}\s-]+$/u;
      if (!validPattern.test(name.trim())) {
        const msg = "Specialization name can only contain letters, numbers, spaces, and hyphens.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      try {
        setIsLoading(true);
        await onUpdate(specialization.id, name.trim());
        onClose();
        showToast({
          type: "success",
          title: "Specialization Updated",
          message: "Specialization updated successfully.",
          duration: 3000,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update specialization.";
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
    [specialization, name, onUpdate, onClose, showToast]
  );

  const handleClose = useCallback(() => {
    if (isLoading) return;
    if (specialization) {
      setName(specialization.name);
    }
    setError(null);
    onClose();
  }, [isLoading, specialization, onClose]);

  if (!isOpen || !specialization) return null;

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
              <h3 className={styles["modal-title"]}>Update Specialization</h3>
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
          <form
            id="updateSpecializationForm"
            onSubmit={handleSubmit}
            className={styles["modal-content"]}
          >
            <div className={styles["form-group"]}>
              <label
                htmlFor="updateSpecializationName"
                className={styles["form-label"]}
              >
                Specialization Name <span className={styles["required"]}>*</span>
              </label>
              <input
                id="updateSpecializationName"
                type="text"
                value={name}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    setName(e.target.value);
                  }
                }}
                className={styles["form-input"]}
                placeholder="Enter specialization name (3-100 characters)"
                disabled={isLoading}
                maxLength={100}
                autoFocus
              />
              <p className={styles["form-hint"]}>{name.length}/100 characters</p>
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
              form="updateSpecializationForm"
              className={styles["modal-button-submit"]}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Saving..." : "Update Specialization"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

