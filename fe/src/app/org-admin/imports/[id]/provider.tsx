"use client";
import { fetchImportDetail } from "@/services/orgAdmin-imports";
import React, { createContext, useContext, useEffect, useState } from "react";

type Ctx = {
  id: string;
  data?: Awaited<ReturnType<typeof fetchImportDetail>>;
  loading: boolean;
  downloadCsv: () => void;
};
const DetailCtx = createContext<Ctx | null>(null);
export const useImportDetail = () => {
  const ctx = useContext(DetailCtx);
  if (!ctx)
    throw new Error("useImportDetail must be used within ImportDetailProvider");
  return ctx;
};

export function useImportEvents(
  id: string,
  onProgress: (data: any) => void,
  onRow: (row: any) => void,
  onComplete?: () => void
) {
  useEffect(() => {
    if (!id) return;
    const es = new EventSource(`/api/org-admin/imports/${id}/events`);

    es.addEventListener("progress", (ev: MessageEvent) => {
      try { 
        onProgress(JSON.parse(ev.data)); 
      } 
      // eslint-disable-next-line no-empty
      catch (e) { /* Bỏ qua lỗi parse JSON */ } 
    });

    es.addEventListener("row", (ev: MessageEvent) => {
      try { 
        onRow(JSON.parse(ev.data)); 
      } 
      // eslint-disable-next-line no-empty
      catch (e) { /* Bỏ qua lỗi parse JSON */ } 
    });

    es.addEventListener("complete", () => {
      onComplete?.();
      es.close();
    });

    es.onerror = () => { es.close(); };
    return () => es.close();
  }, [id, onProgress, onRow, onComplete]);
}

export async function fetchDetail(id: string) {
  const qs = new URLSearchParams({ id });
  const res = await fetch(`/api/org-admin/imports?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`detail failed: ${res.status}`);
  return res.json();
}

export default function ImportDetailProvider({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const [data, setData] = useState<
    Awaited<ReturnType<typeof fetchImportDetail>> | undefined
  >();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let m = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setLoading(true);
    fetchImportDetail(id)
      .then((d) => {
        if (m) setData(d);
      })
      .finally(() => m && setLoading(false));
    return () => {
      m = false;
    };
  }, [id]);
  const downloadCsv = () => {
    window.location.href = `/api/org-admin/imports?download=csv&id=${id}`;
  };
  return (
    <DetailCtx.Provider value={{ id, data, loading, downloadCsv }}>
      {children}
    </DetailCtx.Provider>
  );
}