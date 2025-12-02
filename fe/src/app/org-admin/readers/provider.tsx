"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { toast, useToast } from "@/components/ui/toast";
import {
  changeReaderAccess,
  ReaderResponse,
} from "@/services/org-admin-reader.service";

/**
 * CHUẨN HÓA:
 * - FE UI và Provider dùng URL cố định: /api/org-admin/readers
 * - NextJS API route ở: app/api/org-admin/readers/route.ts
 * - route.ts proxy → BE /api/organization/members
 * => Không đổi UI, không đổi service, không đổi folder API.
 */

export type ReaderStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

type ReadersListResponse = {
  items: ReaderResponse[];
  total: number;
  page: number;
  pageSize: number;
};

interface ReadersContextValue {
  readers: ReaderResponse[];
  loading: boolean;
  error: string | null;
  info: string | null;

  page: number;
  pageSize: number;
  total: number;
  q: string;
  status: ReaderStatus | "ALL";

  reload: () => Promise<void>;
  toggleAccess: (id: string, enable: boolean) => Promise<void>;

  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setQ: (q: string) => void;
  setStatus: (s: ReadersContextValue["status"]) => void;

  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setInfo: React.Dispatch<React.SetStateAction<string | null>>;
}

const ReadersContext = createContext<ReadersContextValue | null>(null);

export function ReadersProvider({ children }: { children: React.ReactNode }) {
  const [readers, setReaders] = useState<ReaderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState<string>("");
  const [status, setStatus] = useState<ReaderStatus | "ALL">("ALL");

  const { showToast } = useToast();

  /**
   * Build URL Next API route
   * FE → /api/org-admin/readers → Next route → BE /organization/members
   */
  const buildUrl = () => {
    const url = new URL(
      "/api/org-admin/readers",
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000",
    );
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    if (q.trim()) url.searchParams.set("q", q.trim());
    if (status !== "ALL") url.searchParams.set("status", status);
    return url.toString();
  };

  /** Load readers via NextJS route */
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = buildUrl();

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load readers (${res.status})`);
      }

      const data = (await res.json()) as ReadersListResponse;

      setReaders(data.items || []);
      setTotal(Number(data.total ?? 0));
    } catch (err: any) {
      const msg = err?.message ?? "Failed to load readers";
      setError(msg);
      showToast(toast.error("Load failed", msg));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, status, showToast]);

  /** Enable/Disable access */
  const toggleAccess = useCallback(
    async (id: string, enable: boolean) => {
      const prev = readers;
      setError(null);
      setInfo(null);

      // Optimistic UI
      setReaders((list) =>
        list.map((r) =>
          r.id === id ? { ...r, status: enable ? "ACTIVE" : "SUSPENDED" } : r,
        ),
      );

      try {
        const updated = await changeReaderAccess({ userId: id, enable });

        setReaders((list) =>
          list.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
        );

        const msg = enable
          ? "Access enabled successfully"
          : "Access removed successfully";

        setInfo(msg);
        showToast(
          enable
            ? toast.success("Access Enabled", msg)
            : toast.error("Access Removed", msg),
        );
      } catch (err: any) {
        // rollback
        setReaders(prev);
        const msg = err?.message ?? "Failed to update access";
        setError(msg);
        showToast(toast.error("Action failed", msg));
        throw err;
      }
    },
    [readers, showToast],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      readers,
      loading,
      error,
      info,
      page,
      pageSize,
      total,
      q,
      status,
      reload,
      toggleAccess,
      setPage,
      setPageSize,
      setQ,
      setStatus,
      setError,
      setInfo,
    }),
    [
      readers,
      loading,
      error,
      info,
      page,
      pageSize,
      total,
      q,
      status,
      reload,
      toggleAccess,
    ],
  );

  return (
    <ReadersContext.Provider value={value}>{children}</ReadersContext.Provider>
  );
}

export function useReaders() {
  const ctx = useContext(ReadersContext);
  if (!ctx) {
    throw new Error("useReaders must be used inside ReadersProvider");
  }
  return ctx;
}
