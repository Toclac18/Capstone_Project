// src/app/docs-view/[id]/_components/LeftSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";

export default function LeftSidebar() {
  const { numPages, page, setPage } = useDocsView();
  const total = Math.max(1, numPages); // fallback khi chưa load PDF
  const pages = Array.from({ length: total }, (_, i) => i + 1);

  const [inputValue, setInputValue] = useState<string>("1");

  // đồng bộ input khi page đổi (click ở thumbnail)
  useEffect(() => {
    setInputValue(String(page));
  }, [page]);

  const handleJump = () => {
    const n = Number(inputValue);
    if (!Number.isFinite(n)) return;
    if (n < 1 || n > total) return;
    setPage(n);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleJump();
    }
  };

  return (
    <aside className={styles.leftSidebar}>
      <div className={styles.leftHeaderRow}>
        <div className={styles.leftHeader}>Pages</div>

        <div className={styles.pageJump}>
          <input
            type="number"
            min={1}
            max={total}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleJump}
            onKeyDown={handleKeyDown}
            className={styles.pageJumpInput}
          />
          <span className={styles.pageJumpTotal}>/ {total}</span>
        </div>
      </div>

      <div className={styles.pageThumbList}>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            className={p === page ? styles.pageThumbActive : styles.pageThumb}
            aria-current={p === page ? "page" : undefined}
          >
            <div className={styles.pageThumbPage} />
            <span className={styles.pageThumbNumber}>{p}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
