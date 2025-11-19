"use client";
import { useMemo } from "react";
import { useSearch } from "../SearchProvider";
import styles from "../styles.module.css";

export default function Pagination() {
  // Lấy meta phân trang từ context (server-side)
  const { page, setPage, perPage, total, pageCount } = useSearch();

  // Số trang tổng do BE trả về
  const totalPages = Math.max(1, pageCount || 1);

  // Tạo dải trang hiển thị (window)
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
      {/* Info: tổng bản ghi + trang hiện tại */}
      <div className={styles.paginationBar} role="status" aria-live="polite">
        <span className={styles.pageInfo}>
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          {" · "}
          {total} results · {perPage} / page
        </span>
      </div>

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

        {/* ‹ Prev */}
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

        {/* Next › */}
        <button
          className={styles.pageBtn}
          onClick={() => setPage(Math.min(totalPages, page + 1))}
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
    </>
  );
}
