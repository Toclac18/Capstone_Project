"use client";

import { useState, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface AddTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (code: number, name: string, description?: string) => Promise<void>;
}

export function AddTypeModal({ isOpen, onClose, onAdd }: AddTypeModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!code.trim()) {
        setError("Type code cannot be empty.");
        return;
      }

      const codeNum = parseInt(code.trim(), 10);
      if (isNaN(codeNum) || codeNum < 1) {
        setError("Type code must be a positive number.");
        return;
      }

      if (!name.trim()) {
        setError("Type name cannot be empty.");
        return;
      }

      try {
        setIsLoading(true);
        await onAdd(codeNum, name.trim(), description.trim() || undefined);
        setCode("");
        setName("");
        setDescription("");
        onClose();
        showToast({
          type: "success",
          title: "Type Added",
          message: "Type added successfully.",
          duration: 3000,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add type.";
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
    [code, name, description, onAdd, onClose, showToast]
  );

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setCode("");
    setName("");
    setDescription("");
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
              <h3 className={styles["modal-title"]}>Add Type</h3>
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
          <form id="addTypeForm" onSubmit={handleSubmit} className={styles["modal-content"]}>
            <div className={styles["form-group"]}>
              <label htmlFor="typeCode" className={styles["form-label"]}>
                Type Code <span className={styles["required"]}>*</span>
              </label>
              <input
                id="typeCode"
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={styles["form-input"]}
                placeholder="Enter type code (positive number)"
                disabled={isLoading}
                min="1"
                autoFocus
              />
            </div>

            <div className={styles["form-group"]}>
              <label htmlFor="typeName" className={styles["form-label"]}>
                Type Name <span className={styles["required"]}>*</span>
              </label>
              <input
                id="typeName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles["form-input"]}
                placeholder="Enter type name"
                disabled={isLoading}
              />
            </div>

            <div className={styles["form-group"]}>
              <label htmlFor="typeDescription" className={styles["form-label"]}>
                Description
              </label>
              <textarea
                id="typeDescription"
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
              form="addTypeForm"
              className={styles["modal-button-submit"]}
              disabled={isLoading || !code.trim() || !name.trim()}
            >
              {isLoading ? "Saving..." : "Add Type"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

