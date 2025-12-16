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
} from "lucide-react";
import type { ReviewResult } from "../api";
import styles from "../styles.module.css";

const SimplePdfViewer = dynamic(
  () => import("./SimplePdfViewer").then((mod) => mod.SimplePdfViewer),
  {
    ssr: false,
    loading: () => (
      <div className={styles["pdf-loading-box"]}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading viewer...</p>
      </div>
    ),
  },
);

interface ReviewDetailModalProps {
  review: ReviewResult;
  onClose: () => void;
  onApprove?: (reason: string) => Promise<void>;
  onReject?: (reason: string) => Promise<void>;
}

export function ReviewDetailModal({
  review,
  onClose,
  onApprove,
  onReject,
}: ReviewDetailModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"document" | "review">("review");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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

  const handleApprove = async () => {
    if (!onApprove) return;
    setLoading(true);
    try {
      await onApprove(reason);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || !reason.trim()) return;
    setLoading(true);
    try {
      await onReject(reason);
    } finally {
      setLoading(false);
    }
  };

  const isPending = review.status === "PENDING";

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div
        className={styles["modal-fullscreen"]}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles["modal-header"]}>
          <h2 className={styles["modal-title"]}>
            Review: {review.document.title}
          </h2>
          <button
            onClick={onClose}
            className={styles["modal-close"]}
            disabled={loading}
          >
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
                className={`${styles["preview-tab"]} ${activeTab === "review" ? styles["tab-active"] : ""}`}
                onClick={() => setActiveTab("review")}
              >
                <FileText className="h-4 w-4" /> Review File
              </button>
              <button
                className={`${styles["preview-tab"]} ${activeTab === "document" ? styles["tab-active"] : ""}`}
                onClick={() => setActiveTab("document")}
              >
                <File className="h-4 w-4" /> Document
              </button>
            </div>

            {/* Preview Content */}
            <div className={styles["preview-content"]}>
              {activeTab === "review" && review.reportFileUrl ? (
                <SimplePdfViewer fileUrl={review.reportFileUrl} />
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
            </div>
          </div>

          {/* Right - Info & Actions */}
          <div className={styles["info-panel"]}>
            {/* Document Info */}
            <div className={styles["info-section"]}>
              <h3 className={styles["info-title"]}>Document Info</h3>
              <div className={styles["info-card"]}>
                <p className={styles["info-label"]}>Title</p>
                <p className={styles["info-value"]}>{review.document.title}</p>
              </div>
              <div className={styles["info-row"]}>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Type</p>
                  <p className={styles["info-value"]}>
                    {review.document.docType.name}
                  </p>
                </div>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Domain</p>
                  <p className={styles["info-value"]}>
                    {review.document.domain.name}
                  </p>
                </div>
              </div>
              <div className={styles["info-card"]}>
                <p className={styles["info-label"]}>Uploaded by</p>
                <p className={styles["info-value"]}>
                  {review.uploader?.fullName || "Unknown"}
                </p>
              </div>
            </div>

            {/* Reviewer Info */}
            <div className={styles["info-section"]}>
              <h3 className={styles["info-title"]}>Reviewer</h3>
              <div className={styles["reviewer-card"]}>
                <div className={styles["avatar-lg"]}>
                  {getInitials(review.reviewer.fullName)}
                </div>
                <div>
                  <p className={styles["reviewer-name-lg"]}>
                    {review.reviewer.fullName}
                  </p>
                  <p className={styles["reviewer-email-lg"]}>
                    {review.reviewer.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Reviewer Decision */}
            <div className={styles["info-section"]}>
              <h3 className={styles["info-title"]}>Reviewer Decision</h3>
              <div
                className={`${styles["decision-card"]} ${review.decision === "APPROVED" ? styles["decision-approve-card"] : styles["decision-reject-card"]}`}
              >
                {review.decision === "APPROVED" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span>
                  {review.decision === "APPROVED"
                    ? "Recommend Approve"
                    : "Recommend Reject"}
                </span>
              </div>
              <div className={styles["comment-card"]}>
                <p className={styles["info-label"]}>Comment</p>
                <p className={styles["comment-text"]}>{review.report}</p>
              </div>
            </div>

            {/* Status */}
            <div className={styles["info-section"]}>
              <h3 className={styles["info-title"]}>Status</h3>
              <div className={styles["status-card"]}>
                <div className={styles["status-row"]}>
                  <span className={styles["status-label"]}>Current Status</span>
                  <span
                    className={`${styles["status"]} ${styles[`status-${review.status.toLowerCase()}`]}`}
                  >
                    {review.status}
                  </span>
                </div>
                <div className={styles["status-row"]}>
                  <span className={styles["status-label"]}>Submitted</span>
                  <span className={styles["status-value"]}>
                    {formatDate(review.submittedAt)}
                  </span>
                </div>
                {review.approval?.approvedAt && (
                  <div className={styles["status-row"]}>
                    <span className={styles["status-label"]}>
                      {review.status === "APPROVED" ? "Approved" : "Rejected"}
                    </span>
                    <span className={styles["status-value"]}>
                      {formatDate(review.approval.approvedAt)} by{" "}
                      {review.approval.approvedByName}
                    </span>
                  </div>
                )}
              </div>
              {review.approval?.rejectionReason && (
                <div className={styles["rejection-card"]}>
                  <p className={styles["rejection-title"]}>Rejection Reason</p>
                  <p className={styles["rejection-text"]}>
                    {review.approval.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {/* Action Section - Only for PENDING */}
            {isPending && (
              <div className={styles["info-section"]}>
                <h3 className={styles["info-title"]}>Your Decision</h3>
                <div className={styles["action-card"]}>
                  <div className={styles["reason-box"]}>
                    <label className={styles["reason-label"]}>
                      Reason{" "}
                      <span className={styles["reason-hint"]}>
                        (required for reject)
                      </span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Enter your reason here..."
                      rows={3}
                      className={styles["reason-input"]}
                      disabled={loading}
                    />
                  </div>
                  <div className={styles["action-buttons-row"]}>
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className={styles["btn-approve"]}
                    >
                      {loading ? (
                        <>
                          <span className={styles["spinner-sm"]} /> Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" /> Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={loading || !reason.trim()}
                      className={styles["btn-reject"]}
                    >
                      {loading ? (
                        <>
                          <span className={styles["spinner-sm"]} /> Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" /> Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
