"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  updateReport,
  type Report,
  type ReportStatus,
  REPORT_STATUS_DISPLAY,
  REPORT_REASON_DISPLAY,
} from "../api";
import Link from "next/link";
import styles from "../styles.module.css";

interface ReportDetailModalProps {
  report: Report;
  onClose: () => void;
  onUpdated: () => void;
}

export function ReportDetailModal({
  report,
  onClose,
  onUpdated,
}: ReportDetailModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || "");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateReport(report.id, {
        status,
        adminNotes: adminNotes || undefined,
      });
      showToast({
        type: "success",
        title: "Success",
        message: "Report updated successfully",
      });
      onUpdated();
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to update report";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (s: ReportStatus) => {
    const statusMap: Record<ReportStatus, string> = {
      PENDING: styles["badge-pending"],
      RESOLVED: styles["badge-resolved"],
    };
    return statusMap[s];
  };

  const modalContent = (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div
        className={styles["modal-container"]}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles["modal-header"]}>
          <div>
            <h3 className={styles["modal-title"]}>Report Details</h3>
            <p className={styles["modal-subtitle"]}>
              #{report.id.slice(0, 8)} • {formatDate(report.createdAt)}
            </p>
          </div>
          <button onClick={onClose} className={styles["modal-close"]}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className={styles["modal-body"]}>
          {/* Info Grid */}
          <div className={styles["info-grid"]}>
            {/* Document */}
            <div className={styles["info-row"]}>
              <span className={styles["info-label"]}>Document</span>
              <Link
                href={`/docs-view/${report.documentId}`}
                target="_blank"
                className={styles["info-link"]}
              >
                {report.documentTitle}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Reporter */}
            <div className={styles["info-row"]}>
              <span className={styles["info-label"]}>Reporter</span>
              <span className={styles["info-value"]}>
                {report.reporter?.fullName || "Unknown"}
                {report.reporter?.email && (
                  <span className={styles["info-sub"]}>
                    {" "}
                    ({report.reporter.email})
                  </span>
                )}
              </span>
            </div>

            {/* Reason */}
            <div className={styles["info-row"]}>
              <span className={styles["info-label"]}>Reason</span>
              <span className={styles["reason-badge"]}>
                {REPORT_REASON_DISPLAY[report.reason]}
              </span>
            </div>

            {/* Current Status */}
            <div className={styles["info-row"]}>
              <span className={styles["info-label"]}>Current Status</span>
              <span className={`${styles.badge} ${getStatusBadgeClass(report.status)}`}>
                {REPORT_STATUS_DISPLAY[report.status]}
              </span>
            </div>

            {/* Reviewed By */}
            {report.reviewedBy && (
              <div className={styles["info-row"]}>
                <span className={styles["info-label"]}>Reviewed By</span>
                <span className={styles["info-value"]}>
                  {report.reviewedBy.fullName}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {report.description && (
            <div className={styles["desc-section"]}>
              <span className={styles["info-label"]}>Description</span>
              <div className={styles["desc-box"]}>{report.description}</div>
            </div>
          )}

          {/* Divider */}
          <div className={styles["divider"]} />

          {/* Update Form */}
          <div className={styles["form-section"]}>
            <h4 className={styles["form-title"]}>Update Report</h4>

            <div className={styles["form-row"]}>
              <label className={styles["form-label"]}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReportStatus)}
                className={styles["form-select"]}
              >
                <option value="PENDING">Pending</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div className={styles["form-row"]}>
              <label className={styles["form-label"]}>Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this report..."
                rows={3}
                maxLength={2000}
                className={styles["form-textarea"]}
              />
              <span className={styles["char-count"]}>
                {adminNotes.length}/2000
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles["modal-footer"]}>
          <button
            onClick={onClose}
            disabled={loading}
            className={styles["btn-cancel"]}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={styles["btn-primary"]}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modalContent, window.document.body);
}
