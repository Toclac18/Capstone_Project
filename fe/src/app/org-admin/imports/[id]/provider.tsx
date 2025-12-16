// src/app/org-admin/imports/[id]/provider.tsx
"use client";

import {
  fetchImportDetail,
  PagedResult,
  OrgEnrollment,
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

export type ImportSummaryStatus = "WAITING" | "PROCESSING" | "COMPLETED";

export type ImportSummary = {
  fileName?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
  status: ImportSummaryStatus;
  totalRows: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  percent: number;
};

type DetailData = PagedResult<OrgEnrollment>;

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
      fileName: null,
      createdAt: null,
      createdBy: null,
      status: "WAITING",
      totalRows: 0,
      successCount: 0,
      failureCount: 0,
      pendingCount: 0,
      percent: 0,
    };
  }

  const totalRows = rows.total ?? rows.items.length;
  let successCount = 0;
  let failureCount = 0;
  let pendingCount = 0;

  for (const e of rows.items) {
    if (e.status === "APPROVED") successCount += 1;
    else if (e.status === "PENDING") pendingCount += 1;
    else failureCount += 1;
  }

  const processed = successCount + failureCount;
  const percent = totalRows > 0 ? Math.round((processed / totalRows) * 100) : 0;

  let status: ImportSummaryStatus = "WAITING";
  if (totalRows === 0) status = "WAITING";
  else if (pendingCount > 0) status = "PROCESSING";
  else status = "COMPLETED";

  return {
    fileName: null,
    createdAt: null,
    createdBy: null,
    status,
    totalRows,
    successCount,
    failureCount,
    pendingCount,
    percent,
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

    fetchImportDetail(id)
      .then((d) => {
        if (mounted) setRows(d);
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
      // Check if data is available
      if (!rows?.items || rows.items.length === 0) {
        showToast(toast.warning("No Data", "No results available to download"));
        return;
      }

      // Define CSV headers
      const headers = [
        "Email",
        "Full Name",
        "Organization",
        "Status",
        "Invited At",
        "Responded At",
      ];

      // Convert rows to CSV format
      const csvData = rows.items.map((item) => [
        item.memberEmail,
        item.memberFullName || "",
        item.organizationName,
        item.status,
        item.invitedAt ? new Date(item.invitedAt).toLocaleString() : "",
        item.respondedAt ? new Date(item.respondedAt).toLocaleString() : "",
      ]);

      // Generate and download CSV
      generateCsv(headers, csvData, `import_results_${id}`);

      // Show success toast
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
