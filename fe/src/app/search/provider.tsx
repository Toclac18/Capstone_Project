// src/app/search/provider.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  DocumentSearchItem,
  SearchFilters,
  Paged,
} from "@/types/document-search";
import { searchDocuments } from "@/services/search-document.service";

export type PerPage = 10 | 20 | 50;

type SearchContextType = {
  items: DocumentSearchItem[];
  loading: boolean;

  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;

  perPage: PerPage;
  setPerPage: (n: PerPage) => void;

  page: number;
  setPage: (n: number) => void;

  total: number;
  pageCount: number;

  reload: () => Promise<void>;
};

const SearchContext = createContext<SearchContextType | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<DocumentSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<SearchFilters>({});
  const [perPage, setPerPage] = useState<PerPage>(10);
  const [page, setPage] = useState<number>(1);

  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const reload = useCallback(async () => {
    console.log(
      "[SearchProvider] reload called with filters:",
      JSON.stringify(filters, null, 2),
    );
    console.log("[SearchProvider] page:", page, "perPage:", perPage);
    setLoading(true);
    try {
      const data: Paged<DocumentSearchItem> = await searchDocuments({
        filters,
        page,
        perPage,
      });
      console.log(
        "[SearchProvider] searchDocuments result - items count:",
        data.items.length,
        "total:",
        data.total,
      );
      setItems(data.items);
      setTotal(data.total);
      setPageCount(Math.max(1, data.pageCount || 1));
    } catch (err) {
      console.error("[SearchProvider] searchDocuments error:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page, perPage]);

  // Load mỗi khi filter / page / perPage thay đổi
  useEffect(() => {
    reload();
  }, [reload]);

  // Custom setFilters that also resets page to 1
  const handleSetFilters = useCallback((newFilters: SearchFilters) => {
    console.log(
      "[SearchProvider] handleSetFilters called with:",
      JSON.stringify(newFilters, null, 2),
    );
    setPage(1); // Reset page first
    setFilters(newFilters);
  }, []);

  // Reset page when perPage changes
  useEffect(() => {
    setPage(1);
  }, [perPage]);

  const value = useMemo(
    () => ({
      items,
      loading,
      filters,
      setFilters: handleSetFilters,
      perPage,
      setPerPage,
      page,
      setPage,
      total,
      pageCount,
      reload,
    }),
    [
      items,
      loading,
      filters,
      handleSetFilters,
      perPage,
      page,
      total,
      pageCount,
      reload,
    ],
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
