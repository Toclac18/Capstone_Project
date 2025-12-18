// src/app/org-admin/imports/[id]/provider.tsx
"use client";

import {
  fetchImportResultItems,
  PagedResult,
  ImportResultItem,
} from "@/services/org-admin-imports.service";
import { toast, useToast } from "@/components/ui/toast";
import { generateCsv } from "@/utils/csv-export";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ImportSummary = {
  totalRows: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
};

type DetailData = PagedResult<ImportResultItem>;

type Ctx = {
  id: string;
  rows?: DetailData;
  summary: ImportSummary;
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

function buildSummary(rows?: DetailData): ImportSummary {
  if (!rows || !rows.items || rows.items.length === 0) {
    return {
      totalRows: 0,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
    };
  }

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const item of rows.items) {
    if (item.status === "SUCCESS") successCount += 1;
    else if (item.status === "FAILED") failedCount += 1;
    else if (item.status === "SKIPPED") skippedCount += 1;
  }

  return {
    totalRows: rows.total ?? rows.items.length,
    successCount,
    failedCount,
    skippedCount,
  };
}

export default function ImportDetailProvider({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const [rows, setRows] = useState<DetailData | undefined>();
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) setLoading(true);
    });

    fetchImportResultItems(id)
      .then((d) => {
        if (mounted) setRows(d);
      })
      .catch((err) => {
        console.error("Failed to fetch import results:", err);
        // Set empty result on error
        if (mounted) {
          setRows({ items: [], total: 0, page: 1, pageSize: 100 });
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const summary = useMemo(() => buildSummary(rows), [rows]);

  const downloadCsv = () => {
    try {
      if (!rows?.items || rows.items.length === 0) {
        showToast(toast.warning("No Data", "No results available to download"));
        return;
      }

      const headers = ["Email", "Status", "Reason"];

      const csvData = rows.items.map((item) => [
        item.email,
        item.status,
        item.reason || "",
      ]);

      generateCsv(headers, csvData, `import_results_${id}`);

      showToast(
        toast.success(
          "Download Complete",
          `Downloaded ${rows.items.length} record(s)`,
        ),
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error occurred";
      showToast(toast.error("Download Failed", errorMsg));
      console.error("CSV download error:", error);
    }
  };

  return (
    <DetailCtx.Provider value={{ id, rows, summary, loading, downloadCsv }}>
      {children}
    </DetailCtx.Provider>
  );
}
