// src/app/org-admin/readers/provider.tsx
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
  fetchReaders,
  OrgEnrollment,
  OrgEnrollStatus,
  OrgEnrollmentListResponse,
} from "@/services/org-admin-reader.service";

export type ReaderStatusFilter = OrgEnrollStatus | "ALL";

interface ReadersContextValue {
  readers: OrgEnrollment[];
  loading: boolean;
  error: string | null;
  info: string | null;

  page: number;
  pageSize: number;
  total: number;
  q: string;
  status: ReaderStatusFilter;

  reload: () => Promise<void>;

  /**
   * enable = true  => JOINED
   * enable = false => REMOVED
   */
  toggleAccess: (enrollmentId: string, enable: boolean) => Promise<void>;

  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setQ: (q: string) => void;
  setStatus: (s: ReaderStatusFilter) => void;

  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setInfo: React.Dispatch<React.SetStateAction<string | null>>;
}

const ReadersContext = createContext<ReadersContextValue | null>(null);

export function ReadersProvider({ children }: { children: React.ReactNode }) {
  const [readers, setReaders] = useState<OrgEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState<string>("");
  const [status, setStatus] = useState<ReaderStatusFilter>("ALL");

  const { showToast } = useToast();

  /** Load readers từ API route (route đang dùng mock hoặc BE tùy USE_MOCK) */
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const payload: OrgEnrollmentListResponse = await fetchReaders({
        page,
        pageSize,
        q,
        status,
      });

      setReaders(payload.data || []);
      setTotal(payload.pageInfo?.totalElements ?? 0);
    } catch (err: any) {
      const msg = err?.message ?? "Failed to load readers";
      setError(msg);
      showToast(toast.error("Load failed", msg));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, status, showToast]);

  /**
   * toggleAccess:
   *  - enable = true  => JOINED
   *  - enable = false => REMOVED
   *
   * Chỉ update FE state, chưa gọi BE.
   * BE sau này có thể implement:
   *   PATCH /org-admin/enrollments/{enrollmentId}/status
   *   body: { status: "JOINED" | "REMOVED" }
   */
  const toggleAccess = useCallback(
    async (enrollmentId: string, enable: boolean) => {
      try {
        // TODO: sau này gọi API thật ở đây

        // Optimistic update local state
        setReaders((prev) =>
          prev.map((r) =>
            r.enrollmentId === enrollmentId
              ? {
                  ...r,
                  status: enable ? "JOINED" : "REMOVED",
                }
              : r,
          ),
        );
      } catch (err: any) {
        const msg = err?.message ?? "Failed to change reader access";
        setError(msg);
        showToast(toast.error("Update failed", msg));
      }
    },
    [showToast],
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
