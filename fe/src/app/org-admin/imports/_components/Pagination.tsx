"use client";
import { useImportHistory } from "../provider";
import s from "../styles.module.css";

export default function Pagination() {
  const { data, filters, gotoPage } = useImportHistory();
  const total = data?.total ?? 0;
  const { page, pageSize } = filters;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={s.pager}>
      <div className={s.pagerInfo}>
        Total <span className={s.pagerHighlight}>{total}</span> batch(es) · Page{" "}
        <span className={s.pagerHighlight}>{page}</span> / {totalPages}
      </div>
      <div className={s.pagerControls}>
        <button
          className={s.btn}
          onClick={() => gotoPage(page - 1)}
          disabled={page <= 1}
        >
          ← Prev
        </button>
        <button
          className={s.btn}
          onClick={() => gotoPage(page + 1)}
          disabled={page >= totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
