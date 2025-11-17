"use client";

import styles from "../styles.module.css";

export default function ActionButtons() {
  return (
    <div className={styles.actions}>
      <button className={styles.actionBtn} type="button">
        What is READEE?
      </button>
      <button className={styles.actionBtn} type="button">
        READEE&apos;s policies
      </button>
      <button className={styles.actionBtn} type="button">
        + Upload my documents
      </button>
    </div>
  );
}
