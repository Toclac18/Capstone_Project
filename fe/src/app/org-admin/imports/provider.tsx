"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchImports, ImportListResponse } from "@/services/orgAdmin-imports";

type Filters = { q: string; status: string; page: number; pageSize: number };

type Ctx = {
  data?: ImportListResponse;
  loading: boolean;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  gotoPage: (p: number) => void;
};

const ImportHistoryCtx = createContext<Ctx | null>(null);
export function useImportHistory() {
  const ctx = useContext(ImportHistoryCtx);
  if (!ctx)
    throw new Error(
      "useImportHistory must be used within ImportHistoryProvider",
    );
  return ctx;
}

export default function ImportHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ImportListResponse | undefined>();

  const filters: Filters = useMemo(
    () => ({
      q: String(sp.get("q") ?? ""),
      status: String(sp.get("status") ?? "ALL"),
      page: Number(sp.get("page") ?? 1),
      pageSize: Number(sp.get("pageSize") ?? 10),
    }),
    [sp],
  );

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setLoading(true);

    fetchImports(filters)
      .then((d) => {
        if (mounted) {
          setData(d);
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [filters.q, filters.status, filters.page, filters.pageSize]);

  const setFilters = (partial: Partial<Filters>) => {
    const next = { ...filters, ...partial };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.status) params.set("status", next.status);
    params.set("page", String(next.page));
    params.set("pageSize", String(next.pageSize));
    router.push(`/org-admin/imports?${params.toString()}`);
  };

  const gotoPage = (p: number) => setFilters({ page: p < 1 ? 1 : p });

  return (
    <ImportHistoryCtx.Provider
      value={{ data, loading, filters, setFilters, gotoPage }}
    >
      {children}
    </ImportHistoryCtx.Provider>
  );
}
