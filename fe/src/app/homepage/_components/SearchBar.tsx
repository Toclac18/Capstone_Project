"use client";

import { useRouter } from "next/navigation";
import { useHomepage } from "../HomepageProvider";
import styles from "../styles.module.css";
import { useState } from "react";

export default function SearchBar() {
  const { q, setQ } = useHomepage();
  const [localQ, setLocalQ] = useState(q);
  const router = useRouter();

  const goSearchPage = () => {
    // Advanced search: chuyển sang trang /search (không dùng ở đây)
    router.push(
      `/search${localQ.trim() ? `?q=${encodeURIComponent(localQ.trim())}` : ""}`,
    );
  };

  return (
    <div className={styles.searchWrap}>
      <input
        className={styles.search}
        placeholder="Search by input title / uploader / specialization"
        value={localQ}
        onChange={(e) => {
          setLocalQ(e.target.value);
          setQ(e.target.value);
        }}
        onKeyDown={(e) => e.key === "Enter" && setQ(localQ)}
        aria-label="Search"
      />
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
