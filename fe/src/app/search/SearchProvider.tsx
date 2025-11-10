"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { DocumentItem, SearchFilters } from "@/types/search";
import { fetchDocuments } from "@/services/searchDocumentService";

export type PerPage = 10 | 20 | 50;

type SearchContextType = {
  items: DocumentItem[];
  loading: boolean;
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  reload: () => Promise<void>;
  perPage: PerPage;
  setPerPage: (n: PerPage) => void;
  page: number;
  setPage: (n: number) => void;
};

const SearchContext = createContext<SearchContextType | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [perPage, setPerPage] = useState<PerPage>(10);
  const [page, setPage] = useState<number>(1);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments(filters);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // reset to first page whenever server-side filters change
    setPage(1);
  }, [filters]);

  const value = useMemo(
    () => ({
      items,
      loading,
      filters,
      setFilters,
      reload,
      perPage,
      setPerPage,
      page,
      setPage,
    }),
    [items, loading, filters, perPage, page],
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}
