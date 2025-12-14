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
        What is READEE?
      </button>
      <button className={styles.actionBtn} type="button">
        READEE&apos;s policies
      </button>
      <button
        className={styles.actionBtn}
        type="button"
        onClick={() => router.push("reader/upload-document")}
      >
        + Upload my documents
      </button>
    </div>
  );
}
