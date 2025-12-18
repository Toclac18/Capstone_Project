"use client";

import styles from "../styles.module.css";
import { useHomepage } from "../provider";

export default function StatsStrip() {
  const { continueReading, topUpvoted, specGroups } = useHomepage();

  const allDocs = [
    ...continueReading,
    ...topUpvoted,
    ...specGroups.flatMap((g) => g.items),
  ];
  const uniqueIds = new Set(allDocs.map((d) => d.id));
  const uniqueOrgs = new Set(allDocs.map((d) => (d as any).orgName ?? ""));
  const totalDocs = uniqueIds.size;
  const totalSpecs = specGroups.length;
  const totalOrgs = Array.from(uniqueOrgs).filter(Boolean).length;

  const continueCount = continueReading.length;
  const savedText =
    continueCount > 0
      ? `You have ${continueCount} document${continueCount > 1 ? "s" : ""} to continue.`
      : "Start by opening a document to keep it in Continue reading.";

  return (
    <div className={styles.statsStrip}>
      <div className={styles.statsCardsRow}>
        <div className={styles.statsCard}>
          <div className={styles.statsLabel}>DOCUMENTS</div>
          <div className={styles.statsValue}>{totalDocs || "8"}</div>
          <div className={styles.statsSub}>
            in your
            <br />
            READEE
            <br />
            library
          </div>
        </div>
        <div className={styles.statsCard}>
          <div className={styles.statsLabel}>SPECS</div>
          <div className={styles.statsValue}>{totalSpecs || "3"}</div>
          <div className={styles.statsSub}>
            expertise
            <br />
            areas to
            <br />
            explore
          </div>
        </div>
        <div className={styles.statsCard}>
          <div className={styles.statsLabel}>ORGS</div>
          <div className={styles.statsValue}>{totalOrgs || "1"}</div>
          <div className={styles.statsSub}>
            trusted
            <br />
            academic
            <br />
            sources
          </div>
        </div>
      </div>
      <div className={styles.statsActivity}>{savedText}</div>
    </div>
  );
}
