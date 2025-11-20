"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Edit2 } from "lucide-react";
import type { Domain } from "../api";
import { useToast } from "@/components/ui/toast";
import styles from "../styles.module.css";

interface UpdateDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: Domain | null;
  onUpdate: (id: string, name: string) => Promise<void>;
}

export function UpdateDomainModal({
  isOpen,
  onClose,
  domain,
  onUpdate,
}: UpdateDomainModalProps) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (domain) {
      setName(domain.name);
      setError(null);
    }
  }, [domain]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!domain) return;
      setError(null);

      if (!name.trim()) {
        setError("Domain name cannot be empty.");
        return;
      }

      try {
        setIsLoading(true);
        await onUpdate(domain.id, name.trim());
        onClose();
        showToast({
          type: "success",
          title: "Domain Updated",
          message: "Domain updated successfully.",
          duration: 3000,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update domain.";
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
    [domain, name, onUpdate, onClose, showToast]
  );

  const handleClose = useCallback(() => {
    if (isLoading) return;
    if (domain) {
      setName(domain.name);
    }
    setError(null);
    onClose();
  }, [isLoading, domain, onClose]);

  if (!isOpen || !domain) return null;

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
              <h3 className={styles["modal-title"]}>Update Domain</h3>
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
          <form id="updateDomainForm" onSubmit={handleSubmit} className={styles["modal-content"]}>
            <div className={styles["form-group"]}>
              <label htmlFor="updateDomainName" className={styles["form-label"]}>
                Domain Name <span className={styles["required"]}>*</span>
              </label>
              <input
                id="updateDomainName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles["form-input"]}
                placeholder="Enter domain name"
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
              form="updateDomainForm"
              className={styles["modal-button-submit"]}
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Saving..." : "Update Domain"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

