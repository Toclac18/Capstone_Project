"use client";

import { useRouter } from "next/navigation";
import { useHomepage } from "../provider";
import styles from "../styles.module.css";
import { useState } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar() {
  const { q, setQ } = useHomepage();
  const [localQ, setLocalQ] = useState(q);
  const router = useRouter();

  const goSearchPage = () => {
    const trimmed = localQ.trim();

    if (trimmed) {
      router.push(`/search#q=${encodeURIComponent(trimmed)}`);
      return;
    }

    router.push("/search");
  };

  return (
    <div className={styles.searchWrap}>
      {/* Search icon on left */}
      <Search className={styles.searchIconLeft} />

      <input
        className={styles.search}
        placeholder="Search documents, uploaders, specializations..."
        value={localQ}
        onChange={(e) => {
          const value = e.target.value;
          setLocalQ(value);
          setQ(value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            goSearchPage();
          }
        }}
        aria-label="Search"
      />

      {/* Clear button */}
      {localQ && (
        <button
          type="button"
          className={styles.clearBtn}
          aria-label="Clear search"
          onClick={() => {
            setLocalQ("");
            setQ("");
          }}
        >
          <X className={styles.clearIcon} />
        </button>
      )}

      {/* Search button */}
      <button
        className={styles.searchIconBtn}
        onClick={goSearchPage}
        aria-label="Go to search page"
        type="button"
      >
        <Search className="h-4 w-4" />
      </button>
    </div>
  );
}
