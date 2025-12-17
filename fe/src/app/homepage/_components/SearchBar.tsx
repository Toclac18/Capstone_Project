"use client";

import { useRouter } from "next/navigation";
import { useHomepage } from "../provider";
import styles from "../styles.module.css";
import { useState } from "react";

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
      <input
        className={styles.search}
        placeholder="Search title, uploader or specialization"
        value={localQ}
        onChange={(e) => {
          const value = e.target.value;
          setLocalQ(value);
          setQ(value); // vẫn sync về homepage provider nếu cần
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            goSearchPage();
          }
        }}
        aria-label="Search"
      />
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
          <svg
            className={styles.clearIcon}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            aria-hidden
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      <button
        className={styles.searchIconBtn}
        onClick={goSearchPage}
        aria-label="Go to search page"
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
  );
}
