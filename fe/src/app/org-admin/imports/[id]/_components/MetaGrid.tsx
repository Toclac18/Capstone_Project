// src/app/org-admin/imports/[id]/_components/MetaGrid.tsx
"use client";

import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useImportDetail } from "../provider";
import s from "../styles.module.css";

export default function MetaGrid() {
  const { summary } = useImportDetail();

  return (
    <section className={s.metaSection}>
      <div className={s.statsGrid}>
        <div className={s.statCard}>
          <div className={s.statValue}>{summary.totalRows}</div>
          <div className={s.statLabel}>Total</div>
        </div>
        <div className={`${s.statCard} ${s.statSuccess}`}>
          <CheckCircle size={20} />
          <div className={s.statValue}>{summary.successCount}</div>
          <div className={s.statLabel}>Success</div>
        </div>
        <div className={`${s.statCard} ${s.statFailed}`}>
          <XCircle size={20} />
          <div className={s.statValue}>{summary.failedCount}</div>
          <div className={s.statLabel}>Failed</div>
        </div>
        <div className={`${s.statCard} ${s.statSkipped}`}>
          <AlertCircle size={20} />
          <div className={s.statValue}>{summary.skippedCount}</div>
          <div className={s.statLabel}>Skipped</div>
        </div>
      </div>
    </section>
  );
}
