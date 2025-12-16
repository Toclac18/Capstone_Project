"use client";

import { useState } from "react";
import { X, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import styles from "../styles.module.css";

interface ReviewerInfo {
  id: string;
  name: string;
  email: string;
}

interface DocumentInfo {
  id: string;
  title: string;
  type: string;
  domain: string;
  uploaderName: string;
}

interface ReviewSubmission {
  id: string;
  document: DocumentInfo;
  reviewer: ReviewerInfo;
  decision: "APPROVE" | "REJECT";
  comment: string;
  reviewFileUrl: string;
  reviewFileName: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

interface ApprovalConfirmModalProps {
  review: ReviewSubmission;
  action: "approve" | "reject";
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export function ApprovalConfirmModal({ review, action, onConfirm, onClose }: ApprovalConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (action === "reject" && !reason.trim()) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    onConfirm(action === "reject" ? reason : undefined);
    setLoading(false);
  };

  const isApprove = action === "approve";
  const isReviewerApprove = review.decision === "APPROVE";
  const isConflicting = (isApprove && !isReviewerApprove) || (!isApprove && isReviewerApprove);

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={`${styles["modal-container"]} ${styles["modal-sm"]}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`${styles["modal-header"]} ${isApprove ? styles["header-approve"] : styles["header-reject"]}`}>
          <div className={styles["header-icon-box"]}>
            {isApprove ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
          </div>
          <h2 className={styles["modal-title"]}>{isApprove ? "Approve Review" : "Reject Review"}</h2>
          <button onClick={onClose} className={styles["modal-close"]} disabled={loading}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className={styles["modal-body"]}>
          {/* Conflict Warning */}
          {isConflicting && (
            <div className={styles["warning-box"]}>
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className={styles["warning-title"]}>Decision Conflict</p>
                <p className={styles["warning-text"]}>
                  Your decision ({isApprove ? "Approve" : "Reject"}) differs from reviewer&apos;s recommendation ({isReviewerApprove ? "Approve" : "Reject"}).
                </p>
              </div>
            </div>
          )}

          {/* Document Summary */}
          <div className={styles["summary-box"]}>
            <p className={styles["summary-label"]}>Document</p>
            <p className={styles["summary-title"]}>{review.document.title}</p>
            <p className={styles["summary-meta"]}>Reviewer: {review.reviewer.name}</p>
          </div>

          {/* Confirmation Message */}
          <p className={styles["confirm-text"]}>
            {isApprove ? (
              <>Are you sure you want to <span className={styles["text-green"]}>approve</span> this review?</>
            ) : (
              <>Are you sure you want to <span className={styles["text-red"]}>reject</span> this review? Please provide a reason.</>
            )}
          </p>

          {/* Rejection Reason - Required */}
          {!isApprove && (
            <div className={styles["reason-box"]}>
              <label className={styles["reason-label"]}>
                Rejection Reason <span className={styles["required"]}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you are rejecting this review..."
                rows={4}
                className={styles["reason-input"]}
                disabled={loading}
              />
              {!reason.trim() && (
                <p className={styles["error-text"]}>Rejection reason is required</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles["modal-footer"]}>
          <button onClick={onClose} className={styles["btn-cancel"]} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (!isApprove && !reason.trim())}
            className={`${styles["btn-confirm"]} ${isApprove ? styles["btn-green"] : styles["btn-red"]}`}
          >
            {loading ? (
              <span className={styles["btn-loading"]}>
                <span className={styles["spinner-sm"]} />
                Processing...
              </span>
            ) : isApprove ? (
              <>
                <CheckCircle className="h-4 w-4" /> Confirm Approve
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" /> Confirm Reject
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
