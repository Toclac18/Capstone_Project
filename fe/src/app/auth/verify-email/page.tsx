"use client";

import { Suspense } from "react";
import VerifyEmailContent from "./_components/VerifyEmailInner";
import styles from "./styles.module.css";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className={styles["page-container"]}>
          <div className={styles.card}>
            <div className={styles.center}>
              <div className="mb-6 flex justify-center">
                <div className={styles["spinner-lg"]}></div>
              </div>
              <h2 className={styles.title}>Loading...</h2>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
