// src/components/common/modal/ConfirmModal.tsx
"use client";

import styles from "./styles.module.css";

type Props = {
  open: boolean;
  title: string;
  content: string;
  subContent?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  content,
  subContent,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.body}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.content}>{content}</p>
          {subContent && <p className={styles.subContent}>{subContent}</p>}
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
