"use client";

import styles from "./styles.module.css";

interface EnableButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  title?: string;
  label?: string;
  loadingLabel?: string;
}

export default function EnableButton({
  onClick,
  disabled,
  loading,
  className = "",
  title = "Enable access",
  label = "Enable",
  loadingLabel = "Enabling…",
}: EnableButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      aria-disabled={isDisabled}
      aria-busy={loading || false}
      className={`${styles["enable-btn"]} ${className}`}
    >
      {loading ? (
        <span className={styles["loading-wrap"]}>
          <svg
            className={styles["loading-icon"]}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className={styles["loading-circle"]}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className={styles["loading-path"]}
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>{loadingLabel}</span>
        </span>
      ) : (
        <span>{label}</span>
      )}
    </button>
  );
}
