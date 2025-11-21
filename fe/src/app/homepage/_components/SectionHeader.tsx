"use client";

import styles from "../styles.module.css";

export default function SectionHeader({ title }: { title: string }) {
  return (
    <div className={styles.sectionHeader}>
      <h2>{title}</h2>
    </div>
  );
}
