"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getActivePolicy } from "@/services/policyService";
import type { Policy } from "@/types/policy";
import { sanitizeHtml } from "@/utils/htmlSanitizer";
import styles from "./styles.module.css";

interface PolicyViewerProps {
  isOpen: boolean;
  onClose: () => void;
  policyId?: string; // Optional: if provided, fetch by ID; otherwise fetch active policy
}

export default function PolicyViewer({
  isOpen,
  onClose,
  policyId,
}: PolicyViewerProps) {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchPolicy = async () => {
      try {
        // Get active policy (for registration/display)
        const activePolicy = await getActivePolicy();
        if (mounted) {
          setPolicy(activePolicy);
        }
      } catch (e: unknown) {
        if (mounted) {
          const errorMessage =
            e instanceof Error ? e.message : "Failed to load policy";
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPolicy();

    return () => {
      mounted = false;
    };
  }, [isOpen, policyId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop, not on modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>{policy?.title || "Term of User"}</h2>
            {policy && (
              <div className={styles.meta}>
                <span className={styles.date}>
                  Version {policy.version} - Last updated:{" "}
                  {new Date(policy.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading policy...</p>
            </div>
          ) : error ? (
            <div className={styles.error}>
              <p>{error}</p>
            </div>
          ) : policy ? (
            <div
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(policy.content) }}
            />
          ) : (
            <div className={styles.empty}>
              <p>No active policy found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
