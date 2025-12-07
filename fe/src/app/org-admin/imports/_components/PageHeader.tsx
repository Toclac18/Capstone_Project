"use client";
import Link from "next/link";
import s from "../styles.module.css";

export default function PageHeader() {
  return (
    <header className={s.header}>
      <div className={s.headerText}>
        <h1 className={s.headerTitle}>Import history</h1>
        <p className={s.headerSubtitle}>
          View the history of all data imports made to your organization.
        </p>
      </div>
      <Link href="/org-admin/imports/new" className={s.btnPrimary}>
        <span className={s.btnPrimaryIcon}>＋</span>
        <span>New import</span>
      </Link>
    </header>
  );
}
