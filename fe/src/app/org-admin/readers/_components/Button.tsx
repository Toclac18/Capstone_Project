"use client";

import styles from "./styles.module.css";

type ButtonVariant = "enable" | "reinvite";

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  title?: string;
  label?: string;
  loadingLabel?: string;
  variant?: ButtonVariant;
}

export default function Button({
  onClick,
  disabled,
  loading,
  className = "",
  title = "Enable access",
  label = "Enable",
  loadingLabel = "Enabling…",
  variant = "enable",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      aria-disabled={isDisabled}
      aria-busy={loading || false}
      className={` ${styles["enable-btn"]} ${variant === "reinvite" ? styles["reinvite-btn"] : ""} ${className} `}
    >
      {loading ? (
        <span className={styles["enable-loading-wrap"]}>
          <svg
            className={styles["enable-loading-icon"]}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className={styles["enable-loading-circle"]}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className={styles["enable-loading-path"]}
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className={styles["btn-text"]}>{loadingLabel}</span>
        </span>
      ) : (
        <span className={styles["enable-content"]}>
          <svg
            className={styles["enable-icon"]}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles["btn-text"]}>{label}</span>
        </span>
      )}
    </button>
  );
}
