// src/app/org-admin/imports/[id]/_components/PageHeader.tsx
"use client";

import Link from "next/link";
import s from "../styles.module.css";
import { useImportDetail } from "../provider";

export default function PageHeader() {
  const { id, downloadCsv } = useImportDetail();

  return (
    <header className={s.header}>
      <div className={s.headerLeft}>
        <Link href="/org-admin/imports" className={s.backLink}>
          ← Back to imports
        </Link>
        <h1 className={s.title}>Import #{id}</h1>
      </div>

      <div className={s.headerActions}>
        <button type="button" className={s.primaryBtn} onClick={downloadCsv}>
          ⬇ Download result (.csv)
        </button>
      </div>
    </header>
  );
}
