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
  // nếu bạn đã update service theo BE mới, ReaderResponse sẽ là item trong mảng "data"
  ReaderResponse,
  ReadersListBackendResponse,
} from "@/services/org-admin-reader.service";

/**
 * CHUẨN HÓA:
 * - FE UI và Provider dùng URL cố định: /api/org-admin/readers
 * - NextJS API route ở: app/api/org-admin/readers/route.ts
 * - route.ts proxy → BE (hoặc mock) và luôn trả về format:
 *
 *   {
 *     success: boolean;
 *     data: ReaderResponse[];
 *     pageInfo: { ... };
 *     timestamp: string;
 *   }
 */

export type ReaderStatus = ReaderResponse["status"];

type ReadersBackendEnvelope = ReadersListBackendResponse;

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
  setStatus: (s: ReaderStatus | "ALL") => void;

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
   * FE → /api/org-admin/readers → Next route → BE
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

      const payload = (await res.json()) as ReadersBackendEnvelope;

      // Theo BE response:
      // {
      //   success: true,
      //   data: ReaderResponse[],
      //   pageInfo: { ... },
      //   timestamp: string
      // }
      setReaders(payload.data || []);
      setTotal(Number(payload.pageInfo?.totalElements ?? 0));
    } catch (err: any) {
      const msg = err?.message ?? "Failed to load readers";
      setError(msg);
      showToast(toast.error("Load failed", msg));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, status, showToast]);

  /**
   * toggleAccess: tạm thời là stub, không gọi BE.
   * Khi bạn có API real, chỉ cần sửa lại implementation này.
   */
  const toggleAccess = useCallback(async (id: string, enable: boolean) => {
    console.warn(
      "[ReadersProvider] toggleAccess called but not implemented yet",
      { id, enable },
    );
    // Nếu muốn có UI "ảo" (optimistic), có thể update state cục bộ ở đây:
    // setReaders((list) =>
    //   list.map((r) =>
    //     r.enrollmentId === id
    //       ? { ...r, status: enable ? "ACTIVE" : "SUSPENDED" }
    //       : r,
    //   ),
    // );
  }, []);

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
    throw new Error("Cannot change access");
  }
  return ctx;
}
