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
  changeEnrollmentStatus,
} from "@/services/org-admin-reader.service";
import { ApiError } from "@/services/http";

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
  reInvite: (enrollmentId: string) => Promise<void>;

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
      const nextStatus: OrgEnrollStatus = enable ? "JOINED" : "REMOVED";

      try {
        await changeEnrollmentStatus({
          enrollmentId,
          status: nextStatus,
        });
        setReaders((prev) =>
          prev.map((r) =>
            r.enrollmentId === enrollmentId ? { ...r, status: nextStatus } : r,
          ),
        );
      } catch (err: any) {
        if (err instanceof ApiError && err.isHandledGlobally) {
          setLoading(false);
          return;
        }

        const msg = typeof err?.message === "string" ? err.message : "Error";
        setError(msg);
        showToast(toast.error("Error", msg));
      }
    },
    [showToast, changeEnrollmentStatus],
  );

  /**
   * reInvite: send a re-invite to a reader who has LEFT
   */
  const reInvite = useCallback(
    async (enrollmentId: string) => {
      try {
        // call BE
        // import inviteMember lazily to avoid circulars at module scope
        const svc = await import("@/services/org-admin-reader.service");
        await svc.inviteMember(enrollmentId);

        // update local state: set status -> PENDING_INVITE and update invitedAt
        const now = new Date().toISOString();
        setReaders((prev) =>
          prev.map((r) =>
            r.enrollmentId === enrollmentId
              ? { ...r, status: "PENDING_INVITE", invitedAt: now }
              : r,
          ),
        );
        showToast(toast.success("Success", "Re_invite reader successfully."));
      } catch (err: any) {
        const msg = typeof err?.message === "string" ? err.message : "Error";
        setError(msg);
        showToast(toast.error("Error", msg));
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
      reInvite,
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
      reInvite,
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
