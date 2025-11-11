"use client";
import { useMemo } from "react";
import { useSearch } from "../SearchProvider";
import styles from "../styles.module.css";

export default function Pagination() {
  const { items, page, setPage, perPage } = useSearch();

  const total = items.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / perPage)),
    [total, perPage],
  );

  const pages = useMemo(() => {
    const out: number[] = [];
    const maxShown = 7;
    let start = Math.max(1, page - 3);
    const end = Math.min(totalPages, start + maxShown - 1);
    if (end - start < maxShown - 1) start = Math.max(1, end - (maxShown - 1));
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, totalPages]);

  return (
    <nav className={styles.paginationNav} aria-label="Pagination">
      {/* « First */}
      <button
        className={styles.pageBtn}
        onClick={() => setPage(1)}
        disabled={page === 1}
        aria-label="First page"
      >
        « First
      </button>

      {/* ‹ Prev — dùng icon mũi tên y như thanh trên */}
      <button
        className={styles.pageBtn}
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
      >
        ◀
      </button>

      {pages.map((p) => (
        <button
          key={p}
          className={p === page ? styles.pageBtnActive : styles.pageBtn}
          onClick={() => setPage(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      {/* Next › — dùng icon mũi tên y như thanh trên */}
      <button
        className={styles.pageBtn}
        onClick={() => setPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        ▶
      </button>

      {/* Last » */}
      <button
        className={styles.pageBtn}
        onClick={() => setPage(totalPages)}
        disabled={page >= totalPages}
        aria-label="Last page"
      >
        Last »
      </button>
    </nav>
  );
}
