"use client";

import { X, AlertTriangle, Power, Ban, Globe } from "lucide-react";
import { createPortal } from "react-dom";
import type { OrgDocument } from "@/services/org-admin-documents.service";
import styles from "../styles.module.css";

type ConfirmModalProps = {
  type: "activate" | "deactivate" | "release";
  doc: OrgDocument;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  type,
  doc,
  loading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const config = {
    activate: {
      title: "Activate Document",
      icon: <Power className="h-5 w-5" />,
      iconClass: styles["modal-icon-green"],
      message: "Are you sure you want to activate",
      description: "This will make the document accessible to organization members.",
      warning: null,
      btnClass: styles["btn-green"],
      btnText: "Activate",
    },
    deactivate: {
      title: "Deactivate Document",
      icon: <Ban className="h-5 w-5" />,
      iconClass: styles["modal-icon-red"],
      message: "Are you sure you want to deactivate",
      description: "This will hide the document from organization members.",
      warning: null,
      btnClass: styles["btn-red"],
      btnText: "Deactivate",
    },
    release: {
      title: "Release to Public",
      icon: <Globe className="h-5 w-5" />,
      iconClass: styles["modal-icon-blue"],
      message: "Are you sure you want to release",
      description: "The document will become publicly accessible.",
      warning:
        "This action cannot be undone. The document will no longer be managed by your organization.",
      btnClass: styles["btn-blue"],
      btnText: "Release to Public",
    },
  };

  const { title, icon, iconClass, message, description, warning, btnClass, btnText } = config[type];

  const modalContent = (
    <div className={styles["modal-overlay"]} onClick={onCancel}>
      <div
        className={styles["modal-container"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["modal-header"]}>
          <div className={`${styles["modal-icon-box"]} ${iconClass}`}>
            {icon}
          </div>
          <h3 className={styles["modal-title"]}>{title}</h3>
          <button onClick={onCancel} className={styles["modal-close"]}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={styles["modal-body"]}>
          <p className={styles["modal-text"]}>
            {message} <span className={styles["modal-doc-name"]}>&quot;{doc.title}&quot;</span>?
          </p>
          <p className={`${styles["modal-text"]} mt-2`}>{description}</p>
          {warning && (
            <div className={styles["modal-warning"]}>
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{warning}</p>
            </div>
          )}
        </div>

        <div className={styles["modal-footer"]}>
          <button
            onClick={onCancel}
            disabled={loading}
            className={styles["btn-cancel"]}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${styles["btn-confirm"]} ${btnClass}`}
          >
            {loading ? (
              <>
                <span className={styles["spinner-sm"]} />
                Processing...
              </>
            ) : (
              btnText
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(modalContent, window.document.body);
}
