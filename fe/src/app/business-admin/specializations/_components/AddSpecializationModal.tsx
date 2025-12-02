"use client";

import { useState, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface AddSpecializationModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainId: string;
  domainName: string;
  onAdd: (code: number, name: string, domainId: string) => Promise<void>;
}

export function AddSpecializationModal({
  isOpen,
  onClose,
  domainId,
  domainName,
  onAdd,
}: AddSpecializationModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!code.trim()) {
        setError("Specialization code cannot be empty.");
        return;
      }

      const codeNum = parseInt(code.trim(), 10);
      if (isNaN(codeNum) || codeNum < 1) {
        setError("Specialization code must be a positive number.");
        return;
      }

      if (!name.trim()) {
        setError("Specialization name cannot be empty.");
        return;
      }

      try {
        setIsLoading(true);
        await onAdd(codeNum, name.trim(), domainId);
        setCode("");
        setName("");
        onClose();
        showToast({
          type: "success",
          title: "Specialization Added",
          message: "Specialization added successfully.",
          duration: 3000,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add specialization.";
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
    [code, name, domainId, onAdd, onClose, showToast]
  );

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setCode("");
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
              <div>
                <h3 className={styles["modal-title"]}>Add Specialization</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Domain: {domainName}
                </p>
              </div>
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
            id="addSpecializationForm"
            onSubmit={handleSubmit}
            className={styles["modal-content"]}
          >
            <div className={styles["form-group"]}>
              <label htmlFor="specializationCode" className={styles["form-label"]}>
                Specialization Code <span className={styles["required"]}>*</span>
              </label>
              <input
                id="specializationCode"
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={styles["form-input"]}
                placeholder="Enter specialization code (positive number)"
                disabled={isLoading}
                min="1"
                autoFocus
              />
            </div>

            <div className={styles["form-group"]}>
              <label htmlFor="specializationName" className={styles["form-label"]}>
                Specialization Name <span className={styles["required"]}>*</span>
              </label>
              <input
                id="specializationName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles["form-input"]}
                placeholder="Enter specialization name"
                disabled={isLoading}
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
              form="addSpecializationForm"
              className={styles["modal-button-submit"]}
              disabled={isLoading || !code.trim() || !name.trim()}
            >
              {isLoading ? "Saving..." : "Add Specialization"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

