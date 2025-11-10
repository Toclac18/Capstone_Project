"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../styles.module.css";

function readInt(sp: URLSearchParams, key: string, fallback: number) {
  const v = parseInt(sp.get(key) || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export default function HomePager({
  totalPages,
  defaultGroupsPerPage = 3,
}: {
  totalPages: number;
  defaultGroupsPerPage?: number; // số nhóm specialization mỗi trang
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const pageKey = "hpPage";
  const sizeKey = "hpSpecSize";

  const page = readInt(new URLSearchParams(sp.toString()), pageKey, 1);
  const size = readInt(
    new URLSearchParams(sp.toString()),
    sizeKey,
    defaultGroupsPerPage,
  );

  const set = (kv: Record<string, string | number>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(kv).forEach(([k, v]) => {
      if (!v || v === "" || v === 0) next.delete(k);
      else next.set(k, String(v));
    });
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  // Nếu đang ở trang > tổng trang (ví dụ sau khi search lọc bớt), tự kẹp lại
  useEffect(() => {
    if (page > totalPages) set({ [pageKey]: Math.max(1, totalPages) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  return (
    <div className={styles.footerPager}>
      <label className={styles.pageSizeWrap}>
        <span className={styles.pageSizeLabel}>Specialization groups</span>
        <select
          className={styles.pageSizeSelect}
          value={size}
          onChange={(e) =>
            set({
              [sizeKey]: parseInt(e.target.value, 10) || defaultGroupsPerPage,
              [pageKey]: 1,
            })
          }
        >
          {[2, 3, 4, 6].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </label>

      <div className={styles.pager}>
        <button
          className={styles.pagerBtn}
          onClick={() => set({ [pageKey]: Math.max(1, page - 1) })}
          disabled={page <= 1}
          aria-label="Previous page"
          type="button"
        >
          ‹
        </button>
        <span className={styles.pagerText}>
          {Math.min(page, totalPages)} / {Math.max(1, totalPages)}
        </span>
        <button
          className={styles.pagerBtn}
          onClick={() => set({ [pageKey]: Math.min(totalPages, page + 1) })}
          disabled={page >= totalPages}
          aria-label="Next page"
          type="button"
        >
          ›
        </button>
      </div>
    </div>
  );
}
