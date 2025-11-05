"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchImportDetail } from "@/services/orgAdmin-imports";

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
  onUpdate: (u: any) => void,
  onComplete?: () => void
) {
  useEffect(() => {
    if (!id) return;
    const es = new EventSource(`/api/org-admin/imports/${id}/events`);

    es.addEventListener("progress", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        onUpdate((prev: any) => ({ ...prev, ...data }));
      } catch {}
    });

    es.addEventListener("complete", () => {
      onComplete?.();
      es.close();
    });

    es.onerror = () => {
      // optional: close or retry
      // es.close();
    };
    return () => es.close();
  }, [id, onUpdate, onComplete]);
}

export async function fetchDetail(id: string) {
  const qs = new URLSearchParams({ id });
  const res = await fetch(`/api/org-admin/imports?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`detail failed: ${res.status}`);
  return res.json(); // trả về object { id, status, totalRows, processedRows, ... }
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
