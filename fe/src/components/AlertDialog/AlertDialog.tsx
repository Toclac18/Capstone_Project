"use client";

import React from "react";
import styles from "./styles.module.css";

export type AlertDialogVariant = "error" | "info" | "success" | "warning";

export interface AlertDialogProps {
  isOpen: boolean;
  variant?: AlertDialogVariant;
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  primaryActionEndpoint?: string;
  onPrimaryAction?: () => void | Promise<void>;
  onClose: () => void;
}

function getDefaultsForVariant(variant: AlertDialogVariant) {
  switch (variant) {
    case "error":
      return {
        icon: "!",
        title: "Something went wrong",
        description:
          "We couldn’t complete your action. Please try again in a moment. If the problem persists, contact the administrator.",
      };
    case "success":
      return {
        icon: "✓",
        title: "Action completed",
        description: "Your request was processed successfully.",
      };
    case "warning":
      return {
        icon: "⚠",
        title: "Please confirm",
        description:
          "There might be side effects for this action. Make sure you understand the changes before proceeding.",
      };
    case "info":
    default:
      return {
        icon: "ℹ",
        title: "Notification",
        description: "Here is some information related to your recent action.",
      };
  }
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  variant = "info",
  title,
  description,
  primaryActionLabel = "OK",
  primaryActionEndpoint,
  onPrimaryAction,
  onClose,
}) => {
  if (!isOpen) return null;

  const defaults = getDefaultsForVariant(variant);
  const finalTitle = title ?? defaults.title;
  const finalDescription = description ?? defaults.description;

  // Use the semantic class names from the CSS module
  const iconClass =
    variant === "error"
      ? styles.iconError
      : variant === "success"
        ? styles.iconSuccess
        : variant === "warning"
          ? styles.iconWarning
          : styles.iconInfo;

  const buttonClass =
    variant === "error"
      ? styles.buttonError
      : variant === "success"
        ? styles.buttonSuccess
        : variant === "warning"
          ? styles.buttonWarning
          : styles.buttonInfo;

  const handleClick = async () => {
    try {
      if (onPrimaryAction) {
        await onPrimaryAction();
      } else if (primaryActionEndpoint) {
        await fetch(primaryActionEndpoint, { method: "GET" });
      }
    } catch (err) {
      console.error("[AlertDialog] primary action failed:", err);
    } finally {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} role="alertdialog" aria-modal="true">
      <div className={styles.dialog}>
        <div className={styles.header}>
          <div className={`${styles.iconBase} ${iconClass}`}>
            {getDefaultsForVariant(variant).icon}
          </div>
          <div>
            <h2 className={styles.title}>{finalTitle}</h2>
            {finalDescription && (
              <p className={styles.body}>{finalDescription}</p>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.primaryButtonBase} ${buttonClass}`}
            onClick={handleClick}
          >
            {primaryActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
