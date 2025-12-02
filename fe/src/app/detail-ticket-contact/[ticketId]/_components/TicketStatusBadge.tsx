"use client";

import styles from "../styles.module.css";

type Props = {
  status?: string | null;
};

export function TicketStatusBadge({ status }: Props) {
  if (!status) return null;

  const normalized = status.toLowerCase();

  let extraClass = styles["ticket-status-pill--new"];
  if (normalized.includes("progress")) {
    extraClass = styles["ticket-status-pill--in-progress"];
  } else if (normalized.includes("resolved")) {
    extraClass = styles["ticket-status-pill--resolved"];
  } else if (normalized.includes("closed")) {
    extraClass = styles["ticket-status-pill--closed"];
  }

  const className = `${styles["ticket-status-pill"]} ${extraClass}`;

  return (
    <span className={className}>
      <span>{status}</span>
    </span>
  );
}
