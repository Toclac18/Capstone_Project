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
          <div className={styles.statsLabel}>Documents</div>
          <div className={styles.statsValue}>{totalDocs || "—"}</div>
          <div className={styles.statsSub}>in your READEE library</div>
        </div>
        <div className={styles.statsCard}>
          <div className={styles.statsLabel}>Specs</div>
          <div className={styles.statsValue}>{totalSpecs || "—"}</div>
          <div className={styles.statsSub}>expertise areas to explore</div>
        </div>
        <div className={styles.statsCard}>
          <div className={styles.statsLabel}>Orgs</div>
          <div className={styles.statsValue}>{totalOrgs || "—"}</div>
          <div className={styles.statsSub}>trusted academic sources</div>
        </div>
      </div>
      <div className={styles.statsActivity}>{savedText}</div>
    </div>
  );
}
