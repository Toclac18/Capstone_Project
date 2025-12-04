"use client";

import { useState, useEffect } from "react";
import styles from "../styles.module.css";

/**
 * HomePager dùng để phân trang cho specialization groups
 * nhưng không còn ghi vào URL nữa.
 *
 * Mọi paging là client-side state.
 */
export default function HomePager({
  totalPages,
  defaultGroupsPerPage = 3,
  onPageChange,
  onPageSizeChange,
}: {
  totalPages: number;
  defaultGroupsPerPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(defaultGroupsPerPage);

  // Khi totalPages thay đổi → clamp page nếu out of range
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      const newPage = Math.max(1, totalPages);
      setPage(newPage);
      onPageChange?.(newPage);
    }
  }, [totalPages, page, onPageChange]);

  const handlePrev = () => {
    const newPage = Math.max(1, page - 1);
    setPage(newPage);
    onPageChange?.(newPage);
  };

  const handleNext = () => {
    const newPage = Math.min(totalPages, page + 1);
    setPage(newPage);
    onPageChange?.(newPage);
  };

  const handlePageSize = (newSize: number) => {
    const safe = Math.max(1, newSize);
    setSize(safe);
    onPageSizeChange?.(safe);
    setPage(1);
    onPageChange?.(1);
  };

  return (
    <div className={styles.footerPager}>
      <label className={styles.pageSizeWrap}>
        <span className={styles.pageSizeLabel}>Specialization groups</span>
        <select
          className={styles.pageSizeSelect}
          value={size}
          onChange={(e) => handlePageSize(parseInt(e.target.value, 10))}
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
          disabled={page <= 1}
          type="button"
          onClick={handlePrev}
        >
          ‹
        </button>

        <span className={styles.pagerText}>
          {page} / {Math.max(1, totalPages)}
        </span>

        <button
          className={styles.pagerBtn}
          disabled={page >= totalPages}
          type="button"
          onClick={handleNext}
        >
          ›
        </button>
      </div>
    </div>
  );
}
