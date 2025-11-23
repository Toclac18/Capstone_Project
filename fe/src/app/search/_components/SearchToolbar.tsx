"use client";
import { useEffect, useState } from "react";
import { useSearch } from "../provider";
import { useDebounce } from "@/hooks/useDebounce";
import { Filter } from "lucide-react";
import styles from "../styles.module.css";

export default function SearchToolbar({
  onOpenFilter,
}: {
  onOpenFilter: () => void;
}) {
  const { filters, setFilters, perPage, setPerPage } = useSearch();

  function getHashQ() {
    if (typeof window === "undefined") return "";
    const raw = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(raw);
    return params.get("q") ?? "";
  }

  const [q, setQ] = useState<string>(getHashQ);
  const debouncedQ = useDebounce(q, 1000);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );
      if (debouncedQ) params.set("q", debouncedQ);
      else params.delete("q");
      window.location.hash = params.toString();
    }
    setFilters({ ...filters, q: debouncedQ || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  return (
    <div className={styles.toolbar} data-testid="search-toolbar">
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search title / organization / specialization / uploader / description"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search library documents"
      />

      <div className={styles.right}>
        <label htmlFor="perPage" className={styles.perPageLabel}>
          Per page
        </label>
        <select
          id="perPage"
          className={styles.perPageSelect}
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value) as any)}
          aria-label="Results per page"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>

        <button
          type="button"
          className={styles.filterButton}
          onClick={onOpenFilter}
          aria-label="Open filters"
        >
          <Filter size={16} />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
}
