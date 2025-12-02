"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  Suspense,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchImports,
  PagedResult,
  MemberImportBatch,
} from "@/services/org-admin-imports.service";

type Filters = { q: string; status: string; page: number; pageSize: number };

type Ctx = {
  data?: PagedResult<MemberImportBatch>;
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

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function ImportHistoryInner({ children }: { children: React.ReactNode }) {
  const sp = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<
    PagedResult<MemberImportBatch> | undefined
  >();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filters: Filters = useMemo(
    () => ({
      q: sp.get("q") ?? "",
      status: sp.get("status") ?? "ALL",
      page: parsePositiveInt(sp.get("page"), 1),
      pageSize: parsePositiveInt(sp.get("pageSize"), 10),
    }),
    [sp],
  );

  useEffect(() => {
    let mounted = true;

    startTransition(() => setLoading(true));

    fetchImports(filters)
      .then((d) => {
        if (mounted) {
          setData(d);
        }
      })
      .finally(() => {
        if (mounted) {
          startTransition(() => setLoading(false));
        }
      });

    return () => {
      mounted = false;
    };
  }, [filters.q, filters.status, filters.page, filters.pageSize]);

  const setFilters = (partial: Partial<Filters>) => {
    const next: Filters = {
      ...filters,
      ...partial,
    };

    // Nếu đổi q hoặc status -> reset page về 1 cho chắc
    if (
      (partial.q !== undefined && partial.q !== filters.q) ||
      (partial.status !== undefined && partial.status !== filters.status)
    ) {
      next.page = 1;
    }

    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.status && next.status !== "ALL") {
      params.set("status", next.status);
    }
    params.set("page", String(next.page));
    params.set("pageSize", String(next.pageSize));
    router.push(`/org-admin/imports?${params.toString()}`);
  };

  const gotoPage = (p: number) => setFilters({ page: p < 1 ? 1 : p });

  return (
    <ImportHistoryCtx.Provider
      value={{
        data,
        loading: loading || isPending,
        filters,
        setFilters,
        gotoPage,
      }}
    >
      {children}
    </ImportHistoryCtx.Provider>
  );
}

export default function ImportHistoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ImportHistoryInner>{children}</ImportHistoryInner>
    </Suspense>
  );
}
