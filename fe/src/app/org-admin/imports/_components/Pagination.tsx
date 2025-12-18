"use client";
import { useImportHistory } from "../provider";
import { Pagination as UIPagination } from "@/components/ui/pagination";

export default function Pagination() {
  const { data, filters, gotoPage, loading } = useImportHistory();
  const total = data?.total ?? 0;
  const { page, pageSize } = filters;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) {
    return null;
  }

  return (
    <UIPagination
      currentPage={page}
      totalPages={totalPages}
      totalItems={total}
      itemsPerPage={pageSize}
      onPageChange={gotoPage}
      loading={loading}
    />
  );
}
