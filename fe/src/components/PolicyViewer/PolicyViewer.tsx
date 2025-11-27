"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getActivePolicyByType, getPolicyView, acceptPolicy } from "@/services/policyService";
import { decodeJwtPayload, extractReaderId } from "@/utils/jwt";
import type { Policy, PolicyType } from "@/types/policy";
import styles from "./styles.module.css";

function getUserIdFromToken(): string | null {
  if (typeof document === "undefined") return null;
  
  const all = document.cookie || "";
  const match = all.match(/(?:^|;\s*)Authorization=([^;]+)/);
  if (!match) return null;
  
  try {
    const token = decodeURIComponent(match[1]);
    const payload = decodeJwtPayload(token);
    return extractReaderId(payload);
  } catch {
    return null;
  }
}

interface PolicyViewerProps {
  isOpen: boolean;
  onClose: () => void;
  policyType: PolicyType;
  userId?: string;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export default function PolicyViewer({
  isOpen,
  onClose,
  policyType,
  userId,
  onAccept,
  showAcceptButton = false,
}: PolicyViewerProps) {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-get userId from token if not provided
  const effectiveUserId = userId || getUserIdFromToken();

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    const fetchPolicy = async () => {
      try {
        // Get active policy by type
        const activePolicy = await getActivePolicyByType(policyType);
        if (mounted) {
          setPolicy(activePolicy);
          
          // If userId available, check acceptance status
          if (effectiveUserId && activePolicy) {
            try {
              const result = await getPolicyView(activePolicy.id, effectiveUserId);
              if (mounted) {
                setHasAccepted(result.hasAccepted);
              }
            } catch {
              // If check fails, just set to false
              if (mounted) {
                setHasAccepted(false);
              }
            }
          } else {
            setHasAccepted(false);
          }
        }
      } catch (e: unknown) {
        if (mounted) {
          const errorMessage = e instanceof Error ? e.message : "Failed to load policy";
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
  }, [isOpen, policyType, effectiveUserId]);

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

  const handleAccept = async () => {
    if (!policy || hasAccepted || !effectiveUserId) return;

    setAccepting(true);
    try {
      await acceptPolicy(policy.id);
      setHasAccepted(true);
      onAccept?.();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to accept policy";
      setError(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>
              {policy?.title || "Policy"}
            </h2>
            {policy && policy.updatedAt && (
              <div className={styles.meta}>
                <span className={styles.date}>
                  Last updated: {new Date(policy.updatedAt).toLocaleDateString()}
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
              dangerouslySetInnerHTML={{ __html: policy.content }}
            />
          ) : (
            <div className={styles.empty}>
              <p>Policy not found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {hasAccepted && policy && (
            <div className={styles.acceptedBadge}>
              ✓ You have accepted this policy
            </div>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              {hasAccepted ? "Close" : "Cancel"}
            </button>
            {showAcceptButton && !hasAccepted && policy && effectiveUserId && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? "Accepting..." : "Accept"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

