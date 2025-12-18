"use client";

import { X, FileText } from "lucide-react";
import type { ReviewRequest } from "../api";
import { formatDate } from "@/utils/format-date";
import styles from "../styles.module.css";

interface DocumentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ReviewRequest | null;
}

export function DocumentInfoModal({
  isOpen,
  onClose,
  request,
}: DocumentInfoModalProps) {
  if (!isOpen || !request) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div
        className={styles["modal-container-lg"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["modal-card"]}>
          {/* Header */}
          <div className={styles["modal-header"]}>
            <div className={styles["modal-header-left"]}>
              <div
                className={`${styles["modal-icon-wrapper"]} ${styles["modal-icon-wrapper-blue"]}`}
              >
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className={styles["modal-title"]}>Document Information</h3>
                <p className={styles["modal-subtitle"]}>
                  Review Request Details
                </p>
              </div>
            </div>
            <button onClick={onClose} className={styles["modal-close-button"]}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className={styles["modal-content"]}>
            <div className={styles["modal-info-section"]}>
              <div className={styles["modal-info-item"]}>
                <span className={styles["modal-info-label"]}>Document:</span>
                <span className={styles["modal-info-value"]}>
                  {request.documentTitle}
                </span>
              </div>

              {request.description && (
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>
                    Description:
                  </span>
                  <span className={styles["modal-info-value"]}>
                    {request.description}
                  </span>
                </div>
              )}

              <div className={styles["modal-info-grid"]}>
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>Uploader:</span>
                  <span className={styles["modal-info-value"]}>
                    {request.uploaderName}
                  </span>
                </div>

                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>
                    Upload Date:
                  </span>
                  <span className={styles["modal-info-value"]}>
                    {formatDate(request.uploadedDate)}
                  </span>
                </div>
              </div>

              <div className={styles["modal-info-grid"]}>
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>Type:</span>
                  <span className={styles["modal-info-value"]}>
                    {request.documentType}
                  </span>
                </div>

                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>Domain:</span>
                  <span className={styles["modal-info-value"]}>
                    {request.domain}
                  </span>
                </div>
              </div>

              {request.specialization && (
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>
                    Specialization:
                  </span>
                  <span className={styles["modal-info-value"]}>
                    {request.specialization}
                  </span>
                </div>
              )}

              {request.tags && request.tags.length > 0 && (
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>Tags:</span>
                  <div className={styles["tags-list"]}>
                    {request.tags.map((tag, idx) => (
                      <span key={`${tag}-${idx}`} className={styles["tag"]}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {request.responseDeadline && (
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>
                    Response Deadline:
                  </span>
                  <span className={styles["modal-info-value"]}>
                    {formatDate(request.responseDeadline)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={styles["modal-footer"]}>
            <button
              onClick={onClose}
              className={styles["modal-button-cancel"]}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
