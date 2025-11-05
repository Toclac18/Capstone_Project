"use client";
import Link from "next/link";
import React from "react";
import s from "../styles.module.css";

export default function PageHeader() {
  return (
    <div className={s.header}>
      <h1 className="text-xl font-semibold">Import history</h1>
      <Link href="/org-admin/imports/new" className={s.btnPrimary}>New import</Link>
    </div>
  );
}
