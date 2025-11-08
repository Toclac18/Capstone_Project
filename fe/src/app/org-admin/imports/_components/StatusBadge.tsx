"use client";
import s from "../styles.module.css";

export default function StatusBadge({ status }: { status: string }) {
  const cls = status === "COMPLETED" ? s.badge + " " + s.badgeGreen
    : status === "FAILED" ? s.badge + " " + s.badgeRed
    : status === "PROCESSING" ? s.badge + " " + s.badgeBlue
    : status === "PENDING" ? s.badge + " " + s.badgeYellow
    : s.badge + " " + s.badgeGray;
  return <span className={cls}>{status}</span>;
}