"use client";

import styles from "../styles.module.css";

export default function ActionButtons() {
  return (
    <div className={styles.actions}>
      <button className={styles.actionBtn} type="button">
        + Upload your documents
      </button>
      <button className={styles.actionBtn} type="button">
        Ask a Question
      </button>
      <button
        className={styles.actionBtn}
        type="button"
        onClick={() => alert("Filter is available on the Search page")}
      >
        Summarize your notes
      </button>
    </div>
  );
}
