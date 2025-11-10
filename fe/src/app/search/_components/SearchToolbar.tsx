"use client";
import { useEffect, useState } from "react";
import { useSearch } from "../SearchProvider";
import styles from "../styles.module.css";

function getHashQ() {
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(raw);
  return params.get("q") ?? "";
}

export default function SearchToolbar({
  onOpenFilter,
}: {
  onOpenFilter: () => void;
}) {
  const [q, setQ] = useState<string>(getHashQ);
  const { perPage, setPerPage, page } = useSearch();

  useEffect(() => {
    const onHashChange = () => setQ(getHashQ());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (q) hash.set("q", q);
    else hash.delete("q");
    window.location.hash = hash.toString();
  }, [q]);

  return (
    <div className={styles.toolbar}>
      <input
        aria-label="Search"
        className={styles.searchInput}
        placeholder="Search title / organization / specialization / uploader (current page)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className={styles.toolbarRight}>
        <label className={styles.perPageLabel}>
          Per page
          <select
            className={styles.select}
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value) as any)}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>

        <button className={styles.filterBtn} onClick={onOpenFilter}>
          <span className={styles.filterIcon} aria-hidden>
            ⚙️
          </span>
          Filters
        </button>
      </div>

      {/* Expose current query string to parent via a custom event */}
      <input type="hidden" value={q} data-page={page} id="__search_q" />
    </div>
  );
}
