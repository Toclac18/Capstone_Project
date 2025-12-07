// src/app/org-admin/imports/[id]/_components/MetaGrid.tsx
"use client";

import StatusBadge from "../../_components/StatusBadge";
import { useImportDetail } from "../provider";
import s from "../styles.module.css";

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function MetaGrid() {
  const { summary } = useImportDetail();

  return (
    <section className={s.metaSection}>
      <div className={s.metaGrid}>
        <div className={s.card}>
          <div className={s.kvRow}>
            <span className={s.kvLabel}>File</span>
            <span className={s.kvValue}>{summary.fileName || "—"}</span>
          </div>
          <div className={s.kvRow}>
            <span className={s.kvLabel}>Created at</span>
            <span className={s.kvValue}>{formatDate(summary.createdAt)}</span>
          </div>
          <div className={s.kvRow}>
            <span className={s.kvLabel}>By</span>
            <span className={s.kvValue}>{summary.createdBy || "—"}</span>
          </div>
        </div>

        <div className={s.card}>
          <div className={s.kvRow}>
            <span className={s.kvLabel}>Total rows</span>
            <span className={s.kvValue}>{summary.totalRows}</span>
          </div>
          <div className={s.kvRow}>
            <span className={s.kvLabel}>Success</span>
            <span className={s.kvValue}>{summary.successCount}</span>
          </div>
          <div className={s.kvRow}>
            <span className={s.kvLabel}>Failed</span>
            <span className={s.kvValue}>{summary.failureCount}</span>
          </div>
        </div>

        <div className={s.statusCard}>
          <div className={s.kvLabel}>Status</div>
          <StatusBadge status={summary.status} />
        </div>
      </div>

      <div className={s.progressBlock}>
        <div className={s.progressText}>
          Progress: {summary.percent}% (
          {summary.successCount + summary.failureCount}/{summary.totalRows})
        </div>
        <div className={s.progressText}>
          Pending: {summary.pendingCount} — Success: {summary.successCount} —
          Failed: {summary.failureCount}
        </div>
        <div className={s.progressTrack}>
          <div
            className={s.progressFill}
            style={{ width: `${summary.percent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
