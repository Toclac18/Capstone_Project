"use client";
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-stroke px-6 py-4 dark:border-stroke-dark sm:flex-row">
      {/* Items info */}
      <div className="text-sm text-dark-6 dark:text-dark-6">
        Showing{" "}
        <span className="font-medium text-dark dark:text-white">
          {startItem}
        </span>{" "}
        to{" "}
        <span className="font-medium text-dark dark:text-white">{endItem}</span>{" "}
        of{" "}
        <span className="font-medium text-dark dark:text-white">
          {totalItems}
        </span>{" "}
        results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stroke-dark dark:text-dark-8 dark:hover:bg-dark-3"
        >
          Previous
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-3 py-2 text-sm font-medium text-dark-6 dark:text-dark-6">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  disabled={loading}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    currentPage === page
                      ? "border-primary bg-primary text-white"
                      : "border-stroke text-dark hover:bg-gray-2 dark:border-stroke-dark dark:text-dark-8 dark:hover:bg-dark-3"
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => {
            console.log("[Pagination] Next clicked", {
              currentPage,
              totalPages,
              loading,
            });
            onPageChange(currentPage + 1);
          }}
          disabled={currentPage === totalPages || loading}
          className="rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-dark hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stroke-dark dark:text-dark-8 dark:hover:bg-dark-3"
        >
          Next
        </button>
      </div>
    </div>
  );
}
