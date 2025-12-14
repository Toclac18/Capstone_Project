"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, FileText, CheckCircle } from "lucide-react";
import { UploadIcon } from "@/assets/icons";
import type { ReviewDocument } from "../api";
import { formatDate } from "@/utils/format-date";
import { formatFileSize } from "@/utils/format-file-size";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import styles from "../styles.module.css";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ReviewDocument | null;
  onSubmit: (data: { action: "APPROVE" | "REJECT"; reportFile: File; reviewRequestId: string }) => Promise<void>;
}

export function ReviewModal({
  isOpen,
  onClose,
  document,
  onSubmit,
}: ReviewModalProps) {
  const { showToast } = useToast();
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal closes or document changes
  useEffect(() => {
    if (!isOpen) {
      setAction(null);
      setReportFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    if (!action || !reportFile) return;

    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await onSubmit({ action, reportFile, reviewRequestId: (document as any).reviewRequestId || document!.id });
      onClose();
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsLoading(false);
    }
  }, [action, reportFile, onSubmit, onClose, document]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file extension (only .doc or .docx)
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith(".doc") && !fileName.endsWith(".docx")) {
        showToast({
          type: "error",
          title: "Invalid file type",
          message: "Review report file must be a Word document (.doc or .docx).",
          duration: 3000,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setReportFile(null);
        return;
      }

      const MAX_REPORT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_REPORT_SIZE_BYTES) {
        showToast({
          type: "error",
          title: "File too large",
          message: "Report file must be 10MB or smaller.",
          duration: 3000,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setReportFile(null);
        return;
      }

      setReportFile(file);
    },
    [showToast]
  );

  const handleRemoveFile = useCallback(() => {
    setReportFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  if (!isOpen || !document) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={handleClose} />
      <div className={styles["modal-container-lg"]}>
        <div className={styles["modal-card"]}>
          {/* Header */}
          <div className={styles["modal-header"]}>
            <div className={styles["modal-header-left"]}>
              <div className={`${styles["modal-icon-wrapper"]} ${styles["modal-icon-wrapper-blue"]}`}>
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className={styles["modal-title"]}>Review Document</h3>
                <p className={styles["modal-subtitle"]}>{document.documentTitle}</p>
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
          <div className={styles["modal-content"]}>
            {/* Document Info */}
            <div className={styles["modal-info-section"]}>
              <div className={styles["modal-info-grid"]}>
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>Document Title:</span>
                  <span className={styles["modal-info-value"]}>{document.documentTitle}</span>
                </div>
                {document.description && (
                  <div className={styles["modal-info-item"]}>
                    <span className={styles["modal-info-label"]}>Description:</span>
                    <span className={styles["modal-info-value"]}>{document.description}</span>
                  </div>
                )}
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>Type:</span>
                  <span className={styles["modal-info-value"]}>{document.documentType}</span>
                </div>
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>Domain:</span>
                  <span className={styles["modal-info-value"]}>{document.domain}</span>
                </div>
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>Uploader:</span>
                  <span className={styles["modal-info-value"]}>{document.uploaderName}</span>
                </div>
                <div className={styles["modal-info-item"]}>
                  <span className={styles["modal-info-label"]}>Upload Date:</span>
                  <span className={styles["modal-info-value"]}>
                    {formatDate(document.uploadedDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Form - File Upload */}
            <div className={styles["review-form-section"]}>
              <label className={styles["review-form-label"]}>
                Review Report <span className={styles["required-asterisk"]}>*</span>
              </label>
              
              {reportFile ? (
                <div className={styles["file-preview-container"]}>
                  <div className={styles["file-preview"]}>
                    <FileText className={styles["file-preview-icon"]} />
                    <div className={styles["file-preview-info"]}>
                      <span className={styles["file-preview-name"]}>{reportFile.name}</span>
                      <span className={styles["file-preview-size"]}>
                        {formatFileSize(reportFile.size)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className={styles["file-preview-remove"]}
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles["file-upload-container"]}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="reviewReport"
                    id="reviewReport"
                    accept=".doc,.docx"
                    onChange={handleFileChange}
                    disabled={isLoading}
                    className={styles["file-upload-input"]}
                  />
                  <label
                    htmlFor="reviewReport"
                    className={styles["file-upload-label"]}
                  >
                    <div className={styles["file-upload-icon-wrapper"]}>
                      <UploadIcon />
                    </div>
                    <p className={styles["file-upload-text"]}>
                      <span className={styles["file-upload-text-primary"]}>Click to upload</span> or drag and drop
                    </p>
                    <p className={styles["file-upload-hint"]}>
                      DOC or DOCX (max. 10MB)
                    </p>
                  </label>
                </div>
              )}
            </div>

            {/* Action Selection */}
            <div className={styles["review-action-section"]}>
              <label className={styles["review-form-label"]}>
                Decision <span className={styles["required-asterisk"]}>*</span>
              </label>
              <div className={styles["review-action-buttons"]}>
                <button
                  type="button"
                  onClick={() => setAction("APPROVE")}
                  disabled={isLoading}
                  className={`${styles["review-action-button"]} ${
                    action === "APPROVE" ? styles["review-action-button-active"] : ""
                  } ${styles["review-action-button-approve"]}`}
                >
                  <CheckCircle className="w-5 h-5" />
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setAction("REJECT")}
                  disabled={isLoading}
                  className={`${styles["review-action-button"]} ${
                    action === "REJECT" ? styles["review-action-button-active"] : ""
                  } ${styles["review-action-button-reject"]}`}
                >
                  <X className="w-5 h-5" />
                  Rejected
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles["modal-footer"]}>
            <button
              onClick={handleClose}
              className={styles["modal-button-cancel"]}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !action || !reportFile}
              className={styles["modal-button-submit"]}
            >
              {isLoading ? (
                <>
                  <Spinner size="md" className="mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

