// src/app/document-report/[documentId]/ReportForm.tsx
"use client";

import { FormEvent, useState } from "react";
import { ReportReason, REPORT_REASON_LABELS } from "@/types/document-report";
import styles from "./styles.module.css";

export interface ReportFormValues {
  reason: ReportReason | "";
  description: string;
}

interface ReportFormProps {
  documentId: string;
  loading: boolean;
  error: string | null;
  maxDescriptionLength?: number;
  onSubmit: (values: ReportFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ReportForm({
  documentId,
  loading,
  error,
  maxDescriptionLength = 2000,
  onSubmit,
  onCancel,
}: ReportFormProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason || loading) return;
    await onSubmit({
      reason,
      description,
    });
  };

  const isExceeded = description.length > maxDescriptionLength;
  const isSubmitDisabled = loading || !reason || isExceeded || !documentId;

  return (
    <form onSubmit={handleSubmit} className={styles.formCard}>
      {/* Document badge */}
      {/* <div className={styles.fieldGroup}>
        <span className={styles.documentBadge}>
          <span className={styles.documentBadgeLabel}>DOCUMENT</span>
          <span className={styles.documentBadgeValue}>{documentId}</span>
        </span>
      </div> */}

      {/* Reason */}
      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <label htmlFor="reason" className={styles.label}>
            Reason
          </label>
          <span className={styles.labelRequired}>Required</span>
        </div>
        <select
          id="reason"
          className={styles.select}
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason | "")}
          disabled={loading}
        >
          <option value="">Select a reason</option>
          {Object.values(ReportReason).map((r) => (
            <option key={r} value={r}>
              {REPORT_REASON_LABELS[r]}
            </option>
          ))}
        </select>
        <p className={styles.helperText}>
          Pick the option that best describes the problem.
        </p>
      </div>

      {/* Description */}
      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <label htmlFor="description" className={styles.label}>
            Description (optional)
          </label>
        </div>
        <textarea
          id="description"
          className={styles.textarea}
          placeholder="Describe what is wrong with this document. Links, page numbers, or short quotes are helpful."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
        <div className={styles.counterRow}>
          <span className={styles.helperText}>
            You can leave this empty, but detailed reports are reviewed faster.
          </span>
          <span
            className={`${styles.counterText} ${
              isExceeded ? styles.counterExceeded : ""
            }`}
          >
            {description.length}/{maxDescriptionLength}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && <div className={styles.errorText}>{error}</div>}

      {/* Actions */}
      <div className={styles.actionsRow}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitDisabled}
        >
          {loading ? <span className={styles.spinner} /> : "Submit report"}
        </button>
      </div>
    </form>
  );
}
