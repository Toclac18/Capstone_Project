// src/app/search/_components/Pagination.tsx
"use client";
import { useMemo } from "react";
import { useSearch } from "../provider";
import styles from "../styles.module.css";

export default function Pagination() {
  const { page, setPage, perPage, total, pageCount } = useSearch();

  const totalPages = Math.max(1, pageCount || 1);

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
    <>
      <div className={styles.paginationBar} role="status" aria-live="polite">
        <span className={styles.pageInfo}>
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          {" · "}
          {total} results · {perPage} / page
        </span>
      </div>

      <nav className={styles.paginationNav} aria-label="Pagination">
        <button
          className={styles.pageBtn}
          onClick={() => setPage(1)}
          disabled={page === 1}
          aria-label="First page"
        >
          «
        </button>

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

        <button
          className={styles.pageBtn}
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          ▶
        </button>

        <button
          className={styles.pageBtn}
          onClick={() => setPage(totalPages)}
          disabled={page >= totalPages}
          aria-label="Last page"
        >
          »
        </button>
      </nav>
    </>
  );
}
