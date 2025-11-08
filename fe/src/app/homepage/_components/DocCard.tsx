"use client";

import styles from "../styles.module.css";
import type { DocumentLite } from "../HomepageProvider";

export default function DocCard({
  doc,
  saved,
  onSave,
}: {
  doc: DocumentLite;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardThumb} />
      <div className={styles.cardMeta}>
        <div className={styles.cardTitle} title={doc.title}>
          {doc.title}
        </div>
        <div className={styles.cardSub}>
          {doc.subject ? <span>{doc.subject}</span> : <span>&nbsp;</span>}
          {typeof doc.pageCount === "number" && (
            <span className={styles.dot}>•</span>
          )}
          {typeof doc.pageCount === "number" && (
            <span>{doc.pageCount} pages</span>
          )}
        </div>
      </div>
      <div className={styles.cardActions}>
        <button className={styles.saveBtn} onClick={onSave}>
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
