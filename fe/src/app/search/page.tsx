"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./styles.module.css";
import FilterModal from "./_components/FilterModal";

type Row = {
  id: string;
  title: string;
  subject?: string;
  pages?: number;
  score?: number;
};

export default function SearchPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [openFilter, setOpenFilter] = useState(false);

  const results: Row[] = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: String(i + 1),
        title: `${(sp.get("q") ?? "Sample").trim() || "Sample"} Document ${i + 1}`,
        subject: i % 2 ? "Lecture notes" : "Summaries",
        pages: 10 + i,
        score: 100 - i,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sp.get("q")],
  );

  useEffect(() => setQ(sp.get("q") ?? ""), [sp]);
  const submit = () =>
    router.push(
      `/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`,
    );

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            placeholder="Search for courses, quizzes, or documents"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            aria-label="Search"
          />
          <button
            className={styles.searchIconBtn}
            onClick={submit}
            aria-label="Search"
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M10 3a7 7 0 105.292 12.292l4.707 4.706 1.414-1.414-4.706-4.707A7 7 0 0010 3zm0 2a5 5 0 110 10A5 5 0 0110 5z" />
            </svg>
          </button>
        </div>

        <div className={styles.actionsRow}>
          <button
            className={styles.filterBtn}
            onClick={() => setOpenFilter(true)}
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M3 5h18v2H3V5zm4 6h10v2H7v-2zm3 6h4v2h-4v-2z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {results.map((r) => (
          <div key={r.id} className={styles.row}>
            <div className={styles.thumb} />
            <div className={styles.info}>
              <a className={styles.title} href={`/doc/${r.id}`}>
                {r.title}
              </a>
              <div className={styles.meta}>
                <span>{r.subject}</span>
                <span>• {r.pages} pages</span>
              </div>
            </div>
            <div className={styles.score}>{r.score}%</div>
          </div>
        ))}
      </div>

      <FilterModal open={openFilter} onClose={() => setOpenFilter(false)} />
    </main>
  );
}
