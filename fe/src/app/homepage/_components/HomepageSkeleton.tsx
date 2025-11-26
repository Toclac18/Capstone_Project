"use client";

import styles from "../styles.module.css";

export default function HomepageSkeleton() {
  return (
    <main className={styles.main}>
      <div className={styles.heroRow}>
        <div className={styles.heroMain}>
          <div className={styles.skelTitle} />
          <div className={styles.skelText} />
          <div className={styles.skelSearch} />
          <div className={styles.skelButtons}>
            <div className={styles.skelBtn} />
            <div className={styles.skelBtn} />
            <div className={styles.skelBtn} />
          </div>
        </div>
        <div className={styles.heroAside}>
          <div className={styles.skelStats} />
        </div>
      </div>

      <div className={styles.skelSectionRow}>
        <div className={styles.skelSectionHeader} />
        <div className={styles.skelCardsRow}>
          <div className={styles.skelCard} />
          <div className={styles.skelCard} />
          <div className={styles.skelCard} />
        </div>
      </div>

      <div className={styles.skelSectionRow}>
        <div className={styles.skelSectionHeader} />
        <div className={styles.skelCardsRow}>
          <div className={styles.skelCard} />
          <div className={styles.skelCard} />
          <div className={styles.skelCard} />
        </div>
      </div>
    </main>
  );
}
