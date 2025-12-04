// src/app/homepage/_components/HomePager.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import styles from "../styles.module.css";

/**
 * HomePager dùng để phân trang cho specialization groups
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

  // 1. Tạo ref để lưu giá trị page mà không gây re-render
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // 3. Logic xử lý khi totalPages thay đổi
  useEffect(() => {
    // Lấy giá trị page hiện tại từ ref (đảm bảo không bị stale closure)
    const currentPage = pageRef.current;

    if (totalPages > 0 && currentPage > totalPages) {
      const newPage = Math.max(1, totalPages);
      setPage(newPage);
      onPageChange?.(newPage);
    }
    // Dependency chỉ có totalPages và onPageChange
  }, [totalPages, onPageChange]);

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

  // Nếu không có trang nào, có thể return null hoặc vẫn hiện tuỳ UI
  if (totalPages <= 0) return null;

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
          aria-label="Previous page"
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
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}
