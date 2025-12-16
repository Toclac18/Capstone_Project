"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { X, FileText, CheckCircle, File, Download, ExternalLink, Loader2 } from "lucide-react";
import { UploadIcon } from "@/assets/icons";
import type { ReviewDocument } from "../api";
import { formatDate } from "@/utils/format-date";
import { formatFileSize } from "@/utils/format-file-size";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import styles from "../styles.module.css";

const SimplePdfViewer = dynamic(
  () => import("@/app/business-admin/review-approval/_components/SimplePdfViewer").then((mod) => mod.SimplePdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className={styles["pdf-loading-box"]}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading viewer...</p>
      </div>
    ),
  }
);

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

      // Validate file extension (PDF or DOCX)
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith(".pdf") && !fileName.endsWith(".docx")) {
        showToast({
          type: "error",
          title: "Invalid file type",
          message: "Review report file must be a PDF or DOCX file.",
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
    <div className={styles["modal-overlay"]} onClick={handleClose}>
      <div className={styles["modal-fullscreen"]} onClick={(e) => e.stopPropagation()}>
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

        {/* Body - 2 columns */}
        <div className={styles["modal-body-split"]}>
          {/* Left - Document Preview */}
          <div className={styles["preview-panel"]}>
            <div className={styles["preview-tabs"]}>
              <button className={`${styles["preview-tab"]} ${styles["preview-tab-active"]}`}>
                <File className="h-4 w-4" /> Document Preview
              </button>
            </div>

            <div className={styles["preview-content"]}>
              {document.fileUrl ? (
                <SimplePdfViewer fileUrl={document.fileUrl} />
              ) : (
                <div className={styles["pdf-loading-box"]}>
                  <FileText className="h-12 w-12 text-gray-400" />
                  <p>Document preview not available</p>
                </div>
              )}
            </div>

            {document.fileUrl && (
              <div className={styles["preview-actions"]}>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles["preview-btn"]}
                >
                  <ExternalLink className="h-4 w-4" /> Open in new tab
                </a>
                <a
                  href={document.fileUrl}
                  download
                  className={styles["preview-btn"]}
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              </div>
            )}
          </div>

          {/* Right - Info & Review Form */}
          <div className={styles["info-panel"]}>
            {/* Document Info */}
            <div className={styles["info-section"]}>
              <h3 className={styles["info-title"]}>Document Info</h3>
              <div className={styles["info-card"]}>
                <p className={styles["info-label"]}>Title</p>
                <p className={styles["info-value"]}>{document.documentTitle}</p>
              </div>
              {document.description && (
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Description</p>
                  <p className={styles["info-value"]}>{document.description}</p>
                </div>
              )}
              <div className={styles["info-row"]}>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Type</p>
                  <p className={styles["info-value"]}>{document.documentType}</p>
                </div>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Domain</p>
                  <p className={styles["info-value"]}>{document.domain}</p>
                </div>
              </div>
              <div className={styles["info-row"]}>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Uploader</p>
                  <p className={styles["info-value"]}>{document.uploaderName}</p>
                </div>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Upload Date</p>
                  <p className={styles["info-value"]}>{formatDate(document.uploadedDate)}</p>
                </div>
              </div>
            </div>

            {/* Review Form */}
            <div className={styles["info-section"]}>
              <h3 className={styles["info-title"]}>Your Review</h3>
              
              {/* File Upload */}
              <div className={styles["info-card"]}>
                <p className={styles["info-label"]}>
                  Review Report <span className="text-red-500">*</span>
                </p>
                {reportFile ? (
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
                ) : (
                  <div className={styles["file-upload-container"]}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="reviewReport"
                      id="reviewReport"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      className={styles["file-upload-input"]}
                    />
                    <label htmlFor="reviewReport" className={styles["file-upload-label"]}>
                      <div className={styles["file-upload-icon-wrapper"]}>
                        <UploadIcon />
                      </div>
                      <p className={styles["file-upload-text"]}>
                        <span className={styles["file-upload-text-primary"]}>Click to upload</span> or drag and drop
                      </p>
                      <p className={styles["file-upload-hint"]}>
                        PDF or DOCX (max. 10MB). DOCX will be converted to PDF.
                      </p>
                    </label>
                  </div>
                )}
              </div>

              {/* Decision */}
              <div className={styles["info-card"]}>
                <p className={styles["info-label"]}>
                  Decision <span className="text-red-500">*</span>
                </p>
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
                    Approve
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
                    Reject
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
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
    </div>
  );
}
