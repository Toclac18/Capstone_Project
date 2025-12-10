"use client";

import { useState, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface AddDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (code: number, name: string) => Promise<void>;
}

export function AddDomainModal({ isOpen, onClose, onAdd }: AddDomainModalProps) {
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
        const msg = "Domain code cannot be empty.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      const codeNum = parseInt(code.trim(), 10);
      if (isNaN(codeNum) || codeNum < 1) {
        const msg = "Domain code must be a positive number.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      if (!name.trim()) {
        const msg = "Domain name cannot be empty.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      if (name.trim().length < 3 || name.trim().length > 100) {
        const msg = "Domain name must be between 3 and 100 characters.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      // Validate special characters
      const validPattern = /^[\p{L}\p{N}\s-]+$/u;
      if (!validPattern.test(name.trim())) {
        const msg = "Domain name can only contain letters, numbers, spaces, and hyphens.";
        setError(msg);
        showToast({ type: "error", title: "Validation Error", message: msg, duration: 3000 });
        return;
      }

      try {
        setIsLoading(true);
        await onAdd(codeNum, name.trim());
        setCode("");
        setName("");
        onClose();
        showToast({
          type: "success",
          title: "Domain Added",
          message: "Domain added successfully.",
          duration: 3000,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add domain.";
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
    [code, name, onAdd, onClose, showToast]
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
              <h3 className={styles["modal-title"]}>Add Domain</h3>
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
          <form id="addDomainForm" onSubmit={handleSubmit} className={styles["modal-content"]}>
            <div className={styles["form-group"]}>
              <label htmlFor="domainCode" className={styles["form-label"]}>
                Domain Code <span className={styles["required"]}>*</span>
              </label>
              <input
                id="domainCode"
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={styles["form-input"]}
                placeholder="Enter domain code (positive number)"
                disabled={isLoading}
                min="1"
                autoFocus
              />
            </div>

            <div className={styles["form-group"]}>
              <label htmlFor="domainName" className={styles["form-label"]}>
                Domain Name <span className={styles["required"]}>*</span>
              </label>
              <input
                id="domainName"
                type="text"
                value={name}
                onChange={(e) => {
                  if (e.target.value.length <= 100) {
                    setName(e.target.value);
                  }
                }}
                className={styles["form-input"]}
                placeholder="Enter domain name (3-100 characters)"
                disabled={isLoading}
                maxLength={100}
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
              form="addDomainForm"
              className={styles["modal-button-submit"]}
              disabled={isLoading || !code.trim() || !name.trim()}
            >
              {isLoading ? "Saving..." : "Add Domain"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

