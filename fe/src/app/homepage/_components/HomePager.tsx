// src/app/homepage/_components/HomePager.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import styles from "../styles.module.css";

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

  // 1. Tạo ref để đọc giá trị page mới nhất trong useEffect
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }); // Không cần dependency, chạy sau mỗi lần render để luôn update ref

  useEffect(() => {
    const currentPage = pageRef.current;

    if (totalPages > 0 && currentPage > totalPages) {
      const newPage = Math.max(1, totalPages);

      // eslint-disable-next-line react-hooks/exhaustive-deps
      setPage(newPage);
      onPageChange?.(newPage);
    }
    // Chỉ chạy khi totalPages thay đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

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
