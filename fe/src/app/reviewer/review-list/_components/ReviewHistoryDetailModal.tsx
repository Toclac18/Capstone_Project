"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  File,
  Loader2,
  Clock,
} from "lucide-react";
import type { ReviewHistory } from "@/types/review";
import { formatDate } from "@/utils/format-date";
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

interface ReviewHistoryDetailModalProps {
  review: ReviewHistory;
  onClose: () => void;
}

export function ReviewHistoryDetailModal({
  review,
  onClose,
}: ReviewHistoryDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"review" | "document">("review");

  const getActionIcon = (action: string) => {
    switch (action) {
      case "APPROVE":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "REJECT":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "APPROVE":
        return "Approved";
      case "REJECT":
        return "Rejected";
      default:
        return action;
    }
  };

  const getBAStatusIcon = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getBAStatusLabel = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return "BA Approved";
      case "REJECTED":
        return "BA Rejected";
      default:
        return "Pending BA Approval";
    }
  };

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div
        className={styles["modal-fullscreen"]}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles["modal-header"]}>
          <div className={styles["modal-header-left"]}>
            <div className={`${styles["modal-icon-wrapper"]} ${styles["modal-icon-wrapper-blue"]}`}>
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className={styles["modal-title"]}>Review History</h3>
              <p className={styles["modal-subtitle"]}>{review.documentTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles["modal-close-button"]}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body - 2 columns */}
        <div className={styles["modal-body-split"]}>
          {/* Left - Document & Review File Preview */}
          <div className={styles["preview-panel"]}>
            {/* Tabs */}
            <div className={styles["preview-tabs"]}>
              <button
                className={`${styles["preview-tab"]} ${activeTab === "review" ? styles["preview-tab-active"] : ""}`}
                onClick={() => setActiveTab("review")}
              >
                <FileText className="h-4 w-4" /> My Review
              </button>
              <button
                className={`${styles["preview-tab"]} ${activeTab === "document" ? styles["preview-tab-active"] : ""}`}
                onClick={() => setActiveTab("document")}
              >
                <File className="h-4 w-4" /> Document
              </button>
            </div>

            {/* Preview Content */}
            <div className={styles["preview-content"]}>
              {activeTab === "review" && review.reportFileUrl ? (
                <SimplePdfViewer fileUrl={review.reportFileUrl} />
              ) : activeTab === "document" && review.fileUrl ? (
                <SimplePdfViewer fileUrl={review.fileUrl} />
              ) : activeTab === "document" ? (
                <div className={styles["pdf-loading-box"]}>
                  <FileText className="h-12 w-12 text-gray-400" />
                  <p>Document preview not available</p>
                </div>
              ) : (
                <div className={styles["pdf-loading-box"]}>
                  <FileText className="h-12 w-12 text-gray-400" />
                  <p>Review file not available</p>
                </div>
              )}
            </div>

            {/* Download buttons */}
            <div className={styles["preview-actions"]}>
              {activeTab === "review" && review.reportFileUrl && (
                <>
                  <a
                    href={review.reportFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles["preview-btn"]}
                  >
                    <ExternalLink className="h-4 w-4" /> Open in new tab
                  </a>
                  <a
                    href={review.reportFileUrl}
                    download
                    className={styles["preview-btn"]}
                  >
                    <Download className="h-4 w-4" /> Download Review
                  </a>
                </>
              )}
              {activeTab === "document" && review.fileUrl && (
                <>
                  <a
                    href={review.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles["preview-btn"]}
                  >
                    <ExternalLink className="h-4 w-4" /> Open in new tab
                  </a>
                  <a
                    href={review.fileUrl}
                    download
                    className={styles["preview-btn"]}
                  >
                    <Download className="h-4 w-4" /> Download Document
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Right - Info */}
          <div className={styles["info-panel"]}>
            {/* Document Info */}
            <div className={styles["info-section"]}>
              <h3 className={styles["info-title"]}>Document Info</h3>
              <div className={styles["info-card"]}>
                <p className={styles["info-label"]}>Title</p>
                <p className={styles["info-value"]}>{review.documentTitle}</p>
              </div>
              <div className={styles["info-row"]}>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Type</p>
                  <p className={styles["info-value"]}>{review.documentType || "—"}</p>
                </div>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Domain</p>
                  <p className={styles["info-value"]}>{review.domain || "—"}</p>
                </div>
              </div>
              {review.specialization && (
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Specialization</p>
                  <p className={styles["info-value"]}>{review.specialization}</p>
                </div>
              )}
              <div className={styles["info-card"]}>
                <p className={styles["info-label"]}>Uploader</p>
                <p className={styles["info-value"]}>{review.uploaderName || "—"}</p>
              </div>
            </div>

            {/* My Review Decision */}
            <div className={styles["info-section"]}>
              <h3 className={styles["info-title"]}>My Review</h3>
              <div
                className={`${styles["decision-card"]} ${
                  review.action === "APPROVE"
                    ? styles["decision-approve-card"]
                    : styles["decision-reject-card"]
                }`}
              >
                {getActionIcon(review.action)}
                <span>{getActionLabel(review.action)}</span>
              </div>
              {review.comments && (
                <div className={styles["comment-card"]}>
                  <p className={styles["info-label"]}>Comment</p>
                  <p className={styles["comment-text"]}>{review.comments}</p>
                </div>
              )}
              <div className={styles["info-card"]}>
                <p className={styles["info-label"]}>Review Date</p>
                <p className={styles["info-value"]}>{formatDate(review.reviewDate)}</p>
              </div>
            </div>

            {/* BA Approval Status */}
            <div className={styles["info-section"]}>
              <h3 className={styles["info-title"]}>BA Approval Status</h3>
              <div className={styles["status-card"]}>
                <div className={styles["status-row"]}>
                  <span className={styles["status-label"]}>Status</span>
                  <div className="flex items-center gap-1.5">
                    {getBAStatusIcon(review.baApprovalStatus)}
                    <span className={styles["status-value"]}>
                      {getBAStatusLabel(review.baApprovalStatus)}
                    </span>
                  </div>
                </div>
                {review.baApproval?.approvedAt && (
                  <div className={styles["status-row"]}>
                    <span className={styles["status-label"]}>
                      {review.baApprovalStatus === "APPROVED" ? "Approved" : "Rejected"} At
                    </span>
                    <span className={styles["status-value"]}>
                      {formatDate(review.baApproval.approvedAt)}
                    </span>
                  </div>
                )}
                {review.baApproval?.approvedByName && (
                  <div className={styles["status-row"]}>
                    <span className={styles["status-label"]}>By</span>
                    <span className={styles["status-value"]}>
                      {review.baApproval.approvedByName}
                    </span>
                  </div>
                )}
              </div>
              {review.baApproval?.rejectionReason && (
                <div className={styles["rejection-card"]}>
                  <p className={styles["rejection-title"]}>Rejection Reason</p>
                  <p className={styles["rejection-text"]}>
                    {review.baApproval.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
