"use client";

import { X, AlertCircle, FileText, Tag, TrendingUp, Info, ShieldAlert } from "lucide-react";
import type { DocumentViolation } from "@/services/document-violations.service";
import styles from "../styles.module.css";

interface ViolationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  violations: DocumentViolation[];
  loading: boolean;
}

export function ViolationsModal({
  isOpen,
  onClose,
  documentName,
  violations,
  loading,
}: ViolationsModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={onClose} />
      <div
        className={styles["modal-container-violations"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["modal-card-violations"]}>
          {/* Header */}
          <div className={styles["modal-header-violations"]}>
            <div className="flex items-start gap-4 flex-1">
              <div className={styles["modal-icon-wrapper-violations"]}>
                <ShieldAlert className="w-7 h-7 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={styles["modal-title-violations"]}>
                  Document Rejected
                </h2>
                <p className={styles["modal-subtitle-violations"]}>
                  {documentName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={styles["modal-close-button-violations"]}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className={styles["modal-content-violations"]}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-200 border-t-red-500 mb-4"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Loading violation details...
                </p>
              </div>
            ) : violations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No violation details available.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={styles["violations-intro"]}>
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p>
                    Your document was rejected by our AI moderation system due to inappropriate content detected on the following page.
                  </p>
                </div>

                {violations.slice(0, 1).map((violation) => (
                  <div key={violation.id} className={styles["violation-card"]}>
                    <div className={styles["violation-info-grid"]}>
                      <div className={styles["violation-info-item"]}>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className={styles["violation-info-label"]}>Page Number</span>
                        </div>
                        <span className={styles["violation-info-value"]}>{violation.page}</span>
                      </div>
                      <div className={styles["violation-info-item"]}>
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className={styles["violation-info-label"]}>Violation Type</span>
                        </div>
                        <span className={styles["violation-info-value"]}>{violation.type}</span>
                      </div>
                      <div className={styles["violation-info-item"]}>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                          <span className={styles["violation-info-label"]}>Classification</span>
                        </div>
                        <span className={`${styles["violation-info-value"]} ${styles["violation-classification"]}`}>
                          {violation.prediction}
                        </span>
                      </div>
                      <div className={styles["violation-info-item"]}>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className={styles["violation-info-label"]}>Confidence Score</span>
                        </div>
                        <span className={styles["violation-info-value"]}>
                          {(violation.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className={styles["violation-content-section"]}>
                      <div className={styles["violation-content-label"]}>
                        <FileText className="w-4 h-4" />
                        <span>Detected Content</span>
                      </div>
                      <div className={styles["violation-snippet"]}>
                        {violation.snippet}
                      </div>
                    </div>
                  </div>
                ))}

                <div className={styles["violations-note"]}>
                  <div className={styles["violations-note-icon"]}>
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={styles["violations-note-title"]}>What to do next?</p>
                    <p className={styles["violations-note-text"]}>
                      Please review and remove the inappropriate content from your document, then upload it again for review.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles["modal-footer-violations"]}>
            <button onClick={onClose} className={styles["modal-button-close"]}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
