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

  // FIX: Sử dụng useRef để lưu giá trị page mới nhất
  // Giúp đọc được page trong useEffect mà không cần thêm vào dependency array
  const pageRef = useRef(page);

  // Luôn cập nhật ref mỗi khi component render
  pageRef.current = page;

  // Khi totalPages thay đổi (ví dụ do filter), kiểm tra xem page hiện tại
  useEffect(() => {
    const currentPage = pageRef.current; // Lấy giá trị page từ ref

    if (totalPages > 0 && currentPage > totalPages) {
      const newPage = Math.max(1, totalPages);
      setPage(newPage);
      onPageChange?.(newPage);
    }
    // Chỉ chạy lại khi totalPages thay đổi
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

    // Reset về trang 1 khi đổi size để tránh dữ liệu rỗng
    setPage(1);
    onPageChange?.(1);
  };

  // Ẩn pager nếu không có dữ liệu hoặc chỉ có 1 trang
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
