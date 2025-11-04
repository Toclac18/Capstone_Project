"use client";
import Link from "next/link";
import React from "react";
import s from "../styles.module.css";
import { useImportDetail } from "../provider";

export default function PageHeader() {
  const { downloadCsv } = useImportDetail();
  return (
    <div className={s.header}>
      <Link href="/org-admin/imports" className={s.link}>← Back to imports</Link>
      <div className="flex gap-2">
        <button className="px-3 py-2 rounded bg-black text-white" onClick={downloadCsv}>Download result CSV</button>
      </div>
    </div>
  );
}
