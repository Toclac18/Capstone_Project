"use client";
import Link from "next/link";
import { FileSpreadsheet, Plus } from "lucide-react";
import s from "../styles.module.css";

export default function PageHeader() {
  return (
    <header className={s.header}>
      <div className={s.headerLeft}>
        <div className={s.headerIcon}>
          <FileSpreadsheet size={20} />
        </div>
        <div className={s.headerText}>
          <h1 className={s.headerTitle}>Import History</h1>
          <p className={s.headerSubtitle}>
            View and manage reader imports
          </p>
        </div>
      </div>
      <Link href="/org-admin/imports/new" className={s.btnPrimary}>
        <Plus size={16} />
        <span>New Import</span>
      </Link>
    </header>
  );
}
