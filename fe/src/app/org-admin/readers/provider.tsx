// src/app/contact-admin/ReadersProvider.tsx
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
 * NOTE:
 * - We KEEP orgAdmin-reader.ts as-is (no breaking changes).
 * - For list fetching (pagination/search), we call the Next.js route directly:
 *   GET /api/org-admin/readers?page=&pageSize=&q=&status=
 *   and expect { items, total, page, pageSize }.
 * - changeReaderAccess still goes through ./api (service layer) to keep contracts stable.
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

  // pagination & search
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

  // pagination & search state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState<string>("");
  const [status, setStatus] = useState<ReaderStatus | "ALL">("ALL");

  const { showToast } = useToast();

  /** Build URL for Next API route with query params */
  const buildUrl = () => {
    const url = new URL(
      "/api/org-admin/readers",
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost",
    );
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(pageSize));
    if (q.trim()) url.searchParams.set("q", q.trim());
    if (status && status !== "ALL") url.searchParams.set("status", status);
    return url.toString();
  };

  /** Load list of readers via Next route (supports mock or real BE) */
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = buildUrl();
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load readers (${res.status})`);
      }
      const data = (await res.json()) as ReadersListResponse;
      setReaders(data.items || []);
      setTotal(Number(data.total ?? 0));
    } catch (e: any) {
      const msg = e?.message || "Failed to load readers";
      setError(msg);
      showToast(toast.error("Load failed", msg));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, status, showToast]);

  /** Toggle access with optimistic UI; uses service API for the action */
  const toggleAccess = useCallback(
    async (id: string, enable: boolean) => {
      const snapshot = readers;

      setError(null);
      setInfo(null);
      // optimistic update
      setReaders((arr) =>
        arr.map((r) =>
          r.id === id ? { ...r, status: enable ? "ACTIVE" : "SUSPENDED" } : r,
        ),
      );

      try {
        const updated = await changeReaderAccess({ userId: id, enable });
        setReaders((arr) =>
          arr.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
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

        // Optional: ensure server ordering/policies are reflected
        // await reload();
      } catch (e: any) {
        // rollback
        setReaders(snapshot);
        const msg = e?.message ?? "Failed to update access";
        setError(msg);
        showToast(toast.error("Action failed", msg));
        throw e;
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
  if (!ctx) throw new Error("useReaders must be used inside ReadersProvider");
  return ctx;
}
