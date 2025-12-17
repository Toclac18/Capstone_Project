"use client";

import { useRouter } from "next/navigation";
import styles from "../styles.module.css";
import { HelpCircle, Shield, Plus } from "lucide-react";

export default function ActionButtons() {
  const router = useRouter();
  return (
    <div className={styles.actions}>
      <button
        className={styles.actionBtn}
        type="button"
        onClick={() => router.push("/")}
      >
        <HelpCircle className="h-4 w-4" />
        What is READEE?
      </button>
      <button className={styles.actionBtn} type="button">
        <Shield className="h-4 w-4" />
        READEE&apos;s policies
      </button>
      <button
        className={`${styles.actionBtn} ${styles.actionPrimary}`}
        type="button"
        onClick={() => router.push("reader/upload-document")}
      >
        <Plus className="h-4 w-4" />
        Upload my documents
      </button>
    </div>
  );
}
