"use client";

import { useEffect } from "react";
import styles from "../styles.module.css";

type Props = { open: boolean; onClose: () => void };

export default function FilterModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.modalRoot}
      role="dialog"
      aria-modal="true"
      aria-label="Filter"
    >
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M3 5h18v2H3V5zm4 6h10v2H7v-2zm3 6h4v2h-4v-2z" />
            </svg>
            Filter
          </div>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close filter"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <label className={styles.label}>University</label>
            <input className={styles.input} placeholder="Enter university" />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label}>Course</label>
            <input
              className={styles.input}
              placeholder="Search for your course"
            />
          </div>
          <div className={styles.sliderRow}>
            <div className={styles.label}>Number of pages</div>
            <input className={styles.range} type="range" min={1} max={400} />
          </div>

          <div className={styles.actionsRight}>
            <button className={styles.linkBtn} type="button" onClick={onClose}>
              Reset
            </button>
            <button
              className={styles.primaryBtn}
              type="button"
              onClick={onClose}
            >
              Show results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
