"use client";

import DocCard from "./_components/DocCard";
import HomepageSidebarAdapter from "./_components/HomepageSidebarAdapter";
import SectionHeader from "./_components/SectionHeader";
import { HomepageProvider, useHomepage } from "./HomepageProvider";
import styles from "./styles.module.css";

function Content() {
  const {
    reader,
    q,
    setQ,
    continueReading,
    bestForYou,
    orgs,
    libraryDocs,
    savedLists,
    onToggleSave,
    isSaved,
  } = useHomepage();

  return (
    <div className={styles.page}>
      {/* LEFT SIDEBAR */}
      <aside className={styles.sidebar}>
        <HomepageSidebarAdapter />
      </aside>

      {/* MAIN */}
      <main className={styles.main}>
        {/* Top search + quick actions */}
        <div className={styles.searchBar}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for courses, quizzes, or documents"
            className={styles.searchInput}
          />
          <div className={styles.quickActions}>
            <button className={styles.quickBtn}>Create a quiz</button>
            <button className={styles.quickBtn}>Ask a Question</button>
            <button className={styles.quickBtn}>Summarize your notes</button>
          </div>
        </div>

        {/* Continue reading */}
        <section className={styles.section}>
          <SectionHeader title="Continue reading" />
          <div className={styles.cardRow}>
            {continueReading.map((d) => (
              <DocCard
                key={d.id}
                doc={d}
                saved={isSaved(d.id)}
                onSave={() => onToggleSave(d.id)}
              />
            ))}
          </div>
        </section>

        {/* Best quizzes for you (gợi ý / placeholder) */}
        <section className={styles.section}>
          <SectionHeader title="Best quizzes for you" />
          <div className={styles.cardRow}>
            {bestForYou.map((d) => (
              <DocCard
                key={d.id}
                doc={d}
                saved={isSaved(d.id)}
                onSave={() => onToggleSave(d.id)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Homepage() {
  return (
    <HomepageProvider>
      <Content />
    </HomepageProvider>
  );
}
