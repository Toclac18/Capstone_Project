"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Clock,
  Users,
  AlertCircle,
  Loader2,
  File,
  Calendar,
  Tag,
  User,
} from "lucide-react";
import type { DocumentListItem } from "../../document/api";
import type { ReviewRequestResponse } from "@/types/review-request";
import { formatDate } from "@/utils/format-date";
import styles from "@/app/reviewer/review-list/styles.module.css";

const SimplePdfViewer = dynamic(
  () =>
    import("../../review-approval/_components/SimplePdfViewer").then(
      (mod) => mod.SimplePdfViewer,
    ),
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

interface DocumentDetailModalProps {
  document: DocumentListItem;
  reviewRequest: ReviewRequestResponse | null;
  onClose: () => void;
}

export function DocumentDetailModal({
  document: doc,
  reviewRequest,
  onClose,
}: DocumentDetailModalProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFileUrl = async () => {
      try {
        const response = await fetch(`/api/business-admin/documents/${doc.id}`);
        if (response.ok) {
          const data = await response.json();
          setFileUrl(data.data?.fileUrl || null);
        }
      } catch (e) {
        console.error("Failed to fetch document file URL:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFileUrl();
  }, [doc.id]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "ACCEPTED":
        return <Users className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
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
            <div
              className={`${styles["modal-icon-wrapper"]} ${styles["modal-icon-wrapper-blue"]}`}
            >
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className={styles["modal-title"]}>Document Detail</h3>
              <p className={styles["modal-subtitle"]}>{doc.title}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles["modal-close-button"]}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - 2 columns */}
        <div className={styles["modal-body-split"]}>
          {/* Left - Document Preview */}
          <div className={styles["preview-panel"]}>
            <div className={styles["preview-tabs"]}>
              <button
                className={`${styles["preview-tab"]} ${styles["preview-tab-active"]}`}
              >
                <File className="h-4 w-4" /> Document Preview
              </button>
            </div>

            <div className={styles["preview-content"]}>
              {loading ? (
                <div className={styles["pdf-loading-box"]}>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Loading document...</p>
                </div>
              ) : fileUrl ? (
                <SimplePdfViewer fileUrl={fileUrl} />
              ) : (
                <div className={styles["pdf-loading-box"]}>
                  <FileText className="h-12 w-12 text-gray-400" />
                  <p>Document preview not available</p>
                </div>
              )}
            </div>

            {fileUrl && (
              <div className={styles["preview-actions"]}>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles["preview-btn"]}
                >
                  <ExternalLink className="h-4 w-4" /> Open in new tab
                </a>
                <a href={fileUrl} download className={styles["preview-btn"]}>
                  <Download className="h-4 w-4" /> Download
                </a>
              </div>
            )}
          </div>

          {/* Right - Info */}
          <div className={styles["info-panel"]}>
            {/* Document Info */}
            <div className={styles["info-section"]}>
              <h3 className={styles["info-title"]}>Document Info</h3>
              <div className={styles["info-card"]}>
                <p className={styles["info-label"]}>Title</p>
                <p className={styles["info-value"]}>{doc.title || "N/A"}</p>
              </div>
              <div className={styles["info-row"]}>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>
                    <Tag className="h-3 w-3 inline mr-1" />
                    Type
                  </p>
                  <p className={styles["info-value"]}>
                    {doc.docTypeName || "N/A"}
                  </p>
                </div>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Domain</p>
                  <p className={styles["info-value"]}>
                    {doc.specializationName?.split(" - ")[0] || "N/A"}
                  </p>
                </div>
              </div>
              <div className={styles["info-row"]}>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>Specialization</p>
                  <p className={styles["info-value"]}>
                    {doc.specializationName || "N/A"}
                  </p>
                </div>
                <div className={styles["info-card"]}>
                  <p className={styles["info-label"]}>
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Created
                  </p>
                  <p className={styles["info-value"]}>
                    {formatDate(doc.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Uploader Info */}
            {doc.uploader && (
              <div className={styles["info-section"]}>
                <h3 className={styles["info-title"]}>
                  <User className="h-4 w-4 inline mr-1" /> Uploader
                </h3>
                <div className={styles["info-card"]}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                      {getInitials(doc.uploader.fullName)}
                    </div>
                    <div>
                      <p className={styles["info-value"]}>
                        {doc.uploader.fullName}
                      </p>
                      {doc.uploader.email && (
                        <p className="text-xs text-gray-500">
                          {doc.uploader.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Review Request Info */}
            {reviewRequest && (
              <div className={styles["info-section"]}>
                <h3 className={styles["info-title"]}>
                  <Users className="h-4 w-4 inline mr-1" /> Review Request
                </h3>
                <div className={styles["status-card"]}>
                  <div className={styles["status-row"]}>
                    <span className={styles["status-label"]}>Status</span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      {getStatusIcon(reviewRequest.status)}
                      {reviewRequest.status}
                    </span>
                  </div>
                  <div className={styles["status-row"]}>
                    <span className={styles["status-label"]}>Created</span>
                    <span className={styles["status-value"]}>
                      {formatDate(reviewRequest.createdAt)}
                    </span>
                  </div>
                  {reviewRequest.responseDeadline && (
                    <div className={styles["status-row"]}>
                      <span className={styles["status-label"]}>
                        Response Deadline
                      </span>
                      <span className={styles["status-value"]}>
                        {formatDate(reviewRequest.responseDeadline)}
                      </span>
                    </div>
                  )}
                  {reviewRequest.reviewDeadline && (
                    <div className={styles["status-row"]}>
                      <span className={styles["status-label"]}>
                        Review Deadline
                      </span>
                      <span className={styles["status-value"]}>
                        {formatDate(reviewRequest.reviewDeadline)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Reviewer Info */}
                {reviewRequest.reviewer && (
                  <div className={styles["info-card"]}>
                    <p className={styles["info-label"]}>Assigned Reviewer</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-white">
                        {getInitials(reviewRequest.reviewer.fullName)}
                      </div>
                      <div>
                        <p className={styles["info-value"]}>
                          {reviewRequest.reviewer.fullName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reviewRequest.reviewer.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Note */}
                {reviewRequest.note && (
                  <div className={styles["comment-card"]}>
                    <p className={styles["info-label"]}>Note</p>
                    <p className={styles["comment-text"]}>{reviewRequest.note}</p>
                  </div>
                )}

                {/* Rejection Reason */}
                {reviewRequest.rejectionReason && (
                  <div className={styles["rejection-card"]}>
                    <p className={styles["rejection-title"]}>Rejection Reason</p>
                    <p className={styles["rejection-text"]}>
                      {reviewRequest.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* No Review Request */}
            {!reviewRequest && doc.status === "PENDING_REVIEW" && (
              <div className={styles["info-section"]}>
                <h3 className={styles["info-title"]}>
                  <AlertCircle className="h-4 w-4 inline mr-1" /> Review Status
                </h3>
                <div className={styles["rejection-card"]}>
                  <p className={styles["rejection-title"]}>No Review Request</p>
                  <p className={styles["rejection-text"]}>
                    This document has not been assigned to a reviewer yet.
                  </p>
                </div>
              </div>
            )}

            {/* Close Button */}
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
    </div>
  );
}
