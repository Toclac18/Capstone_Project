"use client";

import styles from "../styles.module.css";

type Props = {
  title?: string;
  description?: string;
};

export default function EmptyState({
  title = "No documents found",
  description = "Try adjusting your search or filters.",
}: Props) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>📄</div>
      <div className={styles.emptyTitle}>{title}</div>
      <div className={styles.emptyDesc}>{description}</div>
    </div>
  );
}
