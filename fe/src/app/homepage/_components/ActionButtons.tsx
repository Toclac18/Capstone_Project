"use client";

import { useRouter } from "next/navigation";
import styles from "../styles.module.css";

export default function ActionButtons() {
  const router = useRouter();
  return (
    <div className={styles.actions}>
      <button
        className={styles.actionBtn}
        type="button"
        onClick={() => router.push("/")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          style={{ marginRight: 6 }}
        >
          <path
            d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            fill="currentColor"
          />
        </svg>
        What is READEE?
      </button>
      <button className={styles.actionBtn} type="button">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          style={{ marginRight: 6 }}
        >
          <path
            d="M12 1l9 4v6c0 5-3.8 9.7-9 11-5.2-1.3-9-6-9-11V5l9-4z"
            fill="currentColor"
          />
        </svg>
        READEE's policies
      </button>
      <button
        className={`${styles.actionBtn} ${styles.actionPrimary}`}
        type="button"
        onClick={() => router.push("reader/upload-document")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          style={{ marginRight: 8 }}
        >
          <path
            d="M12 5v14m7-7H5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Upload my documents
      </button>
    </div>
  );
}
