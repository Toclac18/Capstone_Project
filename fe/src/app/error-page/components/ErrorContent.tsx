"use client";

import { useRouter } from "next/navigation";
import styles from "../styles.module.css";
import { ErrorIllustration } from "./ErrorIllustration";

interface ErrorContentProps {
  code?: string;
  title?: string;
  message?: string;
}

export const ErrorContent: React.FC<ErrorContentProps> = ({
  code = "500",
  title = "Internal Server Error",
  message = "We apologize for the inconvenience. An unexpected error occurred.",
}) => {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.errorCode}>{code}</div>

        <div className={styles.contentWrapper}>
          <div className={styles.illustrationWrapper}>
            <ErrorIllustration />
          </div>

          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{message}</p>
        </div>
      </div>
    </div>
  );
};
