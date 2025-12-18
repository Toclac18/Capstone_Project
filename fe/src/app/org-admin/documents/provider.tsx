"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  Suspense,
  useTransition,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchOrgDocuments,
  releaseDocument,
  activateDocument,
  deactivateDocument,
  type PagedResult,
  type OrgDocument,
  type DocStatus,
  type DocVisibility,
} from "@/services/org-admin-documents.service";

type Filters = {
  search: string;
  status: DocStatus | "ALL";
  visibility: DocVisibility | "ALL";
  page: number;
  pageSize: number;
};

type Ctx = {
  data?: PagedResult<OrgDocument>;
  loading: boolean;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  gotoPage: (p: number) => void;
  handleRelease: (id: string) => Promise<void>;
  handleActivate: (id: string) => Promise<void>;
  handleDeactivate: (id: string) => Promise<void>;
  refresh: () => void;
};

const DocumentCtx = createContext<Ctx | null>(null);

export function useDocuments() {
  const ctx = useContext(DocumentCtx);
  if (!ctx)
    throw new Error("useDocuments must be used within DocumentProvider");
  return ctx;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function DocumentInner({ children }: { children: React.ReactNode }) {
  const sp = useSearchParams();
  const router = useRouter();

  const [data, setData] = useState<PagedResult<OrgDocument> | undefined>();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [refreshKey, setRefreshKey] = useState(0);

  const filters: Filters = useMemo(
    () => ({
      search: sp.get("search") ?? "",
      status: (sp.get("status") as DocStatus | "ALL") ?? "ALL",
      visibility: (sp.get("visibility") as DocVisibility | "ALL") ?? "ALL",
      page: parsePositiveInt(sp.get("page"), 1),
      pageSize: parsePositiveInt(sp.get("pageSize"), 10),
    }),
    [sp]
  );

  useEffect(() => {
    let mounted = true;

    startTransition(() => setLoading(true));

    fetchOrgDocuments(filters)
      .then((result) => {
        if (mounted) {
          setData(result);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch documents:", err);
      })
      .finally(() => {
        if (mounted) {
          startTransition(() => setLoading(false));
        }
      });

    return () => {
      mounted = false;
    };
  }, [
    filters.search,
    filters.status,
    filters.visibility,
    filters.page,
    filters.pageSize,
    refreshKey,
  ]);

  const setFilters = (partial: Partial<Filters>) => {
    const next: Filters = {
      ...filters,
      ...partial,
    };

    if (
      (partial.search !== undefined && partial.search !== filters.search) ||
      (partial.status !== undefined && partial.status !== filters.status) ||
      (partial.visibility !== undefined &&
        partial.visibility !== filters.visibility)
    ) {
      next.page = 1;
    }

    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.status && next.status !== "ALL") {
      params.set("status", next.status);
    }
    if (next.visibility && next.visibility !== "ALL") {
      params.set("visibility", next.visibility);
    }
    params.set("page", String(next.page));
    params.set("pageSize", String(next.pageSize));
    router.push(`/org-admin/documents?${params.toString()}`);
  };

  const gotoPage = (p: number) => setFilters({ page: p < 1 ? 1 : p });

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleRelease = useCallback(
    async (id: string) => {
      await releaseDocument(id);
      refresh();
    },
    [refresh]
  );

  const handleActivate = useCallback(
    async (id: string) => {
      await activateDocument(id);
      refresh();
    },
    [refresh]
  );

  const handleDeactivate = useCallback(
    async (id: string) => {
      await deactivateDocument(id);
      refresh();
    },
    [refresh]
  );

  return (
    <DocumentCtx.Provider
      value={{
        data,
        loading: loading || isPending,
        filters,
        setFilters,
        gotoPage,
        handleRelease,
        handleActivate,
        handleDeactivate,
        refresh,
      }}
    >
      {children}
    </DocumentCtx.Provider>
  );
}

export default function DocumentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <DocumentInner>{children}</DocumentInner>
    </Suspense>
  );
}
