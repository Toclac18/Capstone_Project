"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  X,
  FileText,
  User,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  File,
} from "lucide-react";
import type { ReviewResultResponse } from "@/services/document-review-result.service";
import styles from "../styles.module.css";

const SimplePdfViewer = dynamic(
  () =>
    import("@/app/business-admin/review-approval/_components/SimplePdfViewer").then(
      (mod) => mod.SimplePdfViewer
    ),
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

interface ReviewResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  reviewResult: ReviewResultResponse | null;
  loading: boolean;
}

export function ReviewResultModal({
  isOpen,
  onClose,
  documentName,
  reviewResult,
  loading,
}: ReviewResultModalProps) {
  const [activeTab, setActiveTab] = useState<"review" | "document">("review");

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDecisionBadge = (decision: string) => {
    if (decision === "APPROVED") {
      return (
        <span className={styles["decision-badge-approved"]}>
          <CheckCircle className="w-4 h-4" />
          Recommend Approve
        </span>
      );
    }
    return (
      <span className={styles["decision-badge-rejected"]}>
        <XCircle className="w-4 h-4" />
        Recommend Reject
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className={styles["status-badge-approved"]}>
            <CheckCircle className="w-4 h-4" />
            Approved by Admin
          </span>
        );
      case "REJECTED":
        return (
          <span className={styles["status-badge-rejected"]}>
            <XCircle className="w-4 h-4" />
            Rejected by Admin
          </span>
        );
      default:
        return (
          <span className={styles["status-badge-pending"]}>
            <Clock className="w-4 h-4" />
            Pending Admin Review
          </span>
        );
    }
  };

  return (
    <div className={styles["modal-overlay-fullscreen"]} onClick={onClose}>
      <div
        className={styles["modal-fullscreen"]}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles["modal-header-fullscreen"]}>
          <div className="flex items-center gap-3">
            <div className={styles["modal-icon-box"]}>
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className={styles["modal-title-fullscreen"]}>Review Result</h3>
              <p className={styles["modal-subtitle-fullscreen"]}>{documentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles["modal-close-btn-fullscreen"]}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading review result...</p>
          </div>
        ) : !reviewResult ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20">
            <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No review result available for this document.
            </p>
          </div>
        ) : (
          <div className={styles["modal-body-split"]}>
            {/* Left - PDF Preview */}
            <div className={styles["preview-panel"]}>
              {/* Tabs */}
              <div className={styles["preview-tabs"]}>
                <button
                  className={`${styles["preview-tab"]} ${activeTab === "review" ? styles["preview-tab-active"] : ""}`}
                  onClick={() => setActiveTab("review")}
                >
                  <FileText className="h-4 w-4" /> Review File
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
                {activeTab === "review" && reviewResult.reportFileUrl ? (
                  <SimplePdfViewer fileUrl={reviewResult.reportFileUrl} />
                ) : activeTab === "document" && reviewResult.document.fileUrl ? (
                  <SimplePdfViewer fileUrl={reviewResult.document.fileUrl} />
                ) : (
                  <div className={styles["pdf-loading-box"]}>
                    <FileText className="h-12 w-12 text-gray-400" />
                    <p>{activeTab === "review" ? "Review file not available" : "Document preview not available"}</p>
                  </div>
                )}
              </div>

              {/* Download buttons */}
              <div className={styles["preview-actions"]}>
                {activeTab === "review" && reviewResult.reportFileUrl && (
                  <>
                    <a
                      href={reviewResult.reportFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles["preview-btn"]}
                    >
                      <ExternalLink className="h-4 w-4" /> Open in new tab
                    </a>
                    <a
                      href={reviewResult.reportFileUrl}
                      download
                      className={styles["preview-btn"]}
                    >
                      <Download className="h-4 w-4" /> Download Review
                    </a>
                  </>
                )}
                {activeTab === "document" && reviewResult.document.fileUrl && (
                  <>
                    <a
                      href={reviewResult.document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles["preview-btn"]}
                    >
                      <ExternalLink className="h-4 w-4" /> Open in new tab
                    </a>
                    <a
                      href={reviewResult.document.fileUrl}
                      download
                      className={styles["preview-btn"]}
                    >
                      <Download className="h-4 w-4" /> Download Document
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Right - Info Panel */}
            <div className={styles["info-panel"]}>
              {/* Document Info */}
              <div className={styles["info-section"]}>
                <h3 className={styles["info-title"]}>Document Info</h3>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Title</p>
                  <p className={styles["info-value"]}>{reviewResult.document.title}</p>
                </div>
                <div className={styles["info-row"]}>
                  {reviewResult.document.docType && (
                    <div className={styles["info-card"]}>
                      <p className={styles["info-label"]}>Type</p>
                      <p className={styles["info-value"]}>{reviewResult.document.docType.name}</p>
                    </div>
                  )}
                  {reviewResult.document.domain && (
                    <div className={styles["info-card"]}>
                      <p className={styles["info-label"]}>Domain</p>
                      <p className={styles["info-value"]}>{reviewResult.document.domain.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviewer Info */}
              <div className={styles["info-section"]}>
                <h3 className={styles["info-title"]}>
                  <User className="w-4 h-4 inline mr-2" />
                  Reviewer
                </h3>
                <div className={styles["reviewer-card"]}>
                  <div className={styles["avatar-lg"]}>
                    {getInitials(reviewResult.reviewer.fullName)}
                  </div>
                  <div>
                    <p className={styles["reviewer-name-lg"]}>{reviewResult.reviewer.fullName}</p>
                    <p className={styles["reviewer-email-lg"]}>{reviewResult.reviewer.email}</p>
                  </div>
                </div>
              </div>

              {/* Reviewer Decision */}
              <div className={styles["info-section"]}>
                <h3 className={styles["info-title"]}>Reviewer Decision</h3>
                <div className={styles["decision-card-wrapper"]}>
                  {getDecisionBadge(reviewResult.decision)}
                </div>
                {reviewResult.report && (
                  <div className={styles["comment-card"]}>
                    <p className={styles["info-label"]}>Comment</p>
                    <p className={styles["comment-text"]}>{reviewResult.report}</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className={styles["info-section"]}>
                <h3 className={styles["info-title"]}>Status</h3>
                <div className={styles["status-card"]}>
                  <div className={styles["status-row"]}>
                    <span className={styles["status-label"]}>Current Status</span>
                    {getStatusBadge(reviewResult.status)}
                  </div>
                  <div className={styles["status-row"]}>
                    <span className={styles["status-label"]}>Submitted</span>
                    <span className={styles["status-value"]}>{formatDate(reviewResult.submittedAt)}</span>
                  </div>
                  {reviewResult.approval?.approvedAt && (
                    <div className={styles["status-row"]}>
                      <span className={styles["status-label"]}>
                        {reviewResult.status === "APPROVED" ? "Approved" : "Rejected"}
                      </span>
                      <span className={styles["status-value"]}>
                        {formatDate(reviewResult.approval.approvedAt)}
                        {reviewResult.approval.approvedByName && ` by ${reviewResult.approval.approvedByName}`}
                      </span>
                    </div>
                  )}
                </div>
                {reviewResult.approval?.rejectionReason && (
                  <div className={styles["rejection-card"]}>
                    <p className={styles["rejection-title"]}>Rejection Reason</p>
                    <p className={styles["rejection-text"]}>{reviewResult.approval.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className={styles["modal-footer"]}>
                <button onClick={onClose} className={styles["modal-button-cancel"]}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
