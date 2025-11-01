"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchReaders, changeReaderAccess, type ReaderResponse } from "./api";
import { toast, useToast } from "@/components/ui/toast";

interface ReadersContextValue {
  readers: ReaderResponse[];
  loading: boolean;
  error: string | null;
  info: string | null;
  reload: () => Promise<void>;
  toggleAccess: (id: string, enable: boolean) => Promise<void>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setInfo: React.Dispatch<React.SetStateAction<string | null>>;
}

const ReadersContext = createContext<ReadersContextValue | null>(null);

export function ReadersProvider({ children }: { children: React.ReactNode }) {
  const [readers, setReaders] = useState<ReaderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { showToast } = useToast();

  /** Load list of readers */
  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReaders();
      setReaders(data.items || []);
    } catch (e: any) {
      const msg = e?.message || "Failed to load readers";
      setError(msg);
      showToast(toast.error("Load failed", msg));
    } finally {
      setLoading(false);
    }
  };

  const toggleAccess = async (id: string, enable: boolean) => {
    const snapshot = readers;

    setError(null);
    setInfo(null);

    try {
      const updated = await changeReaderAccess({ userId: id, enable });

      setReaders((arr) =>
        arr.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
      );

      setReaders((arr) =>
        arr.map((r) =>
          r.id === id ? { ...r, status: enable ? "ACTIVE" : "SUSPENDED" } : r,
        ),
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
    } catch (e: any) {
      setReaders(snapshot);
      const msg = e?.message ?? "Failed to update access";
      setError(msg);
      showToast(toast.error("Action failed", msg));
      throw e;
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const value = useMemo(
    () => ({
      readers,
      loading,
      error,
      info,
      reload,
      toggleAccess,
      setError,
      setInfo,
    }),
    [readers, loading, error, info],
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
