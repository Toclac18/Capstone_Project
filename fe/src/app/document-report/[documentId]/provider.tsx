// src/app/document-report/[documentId]/provider.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast, useToast } from "@/components/ui/toast";
import { CreateReportRequest, ReportReason } from "@/types/document-report";
import { createDocumentReport } from "@/services/document-report.service";
import { ApiError } from "@/services/http";

export interface SubmitValues {
  reason: ReportReason | "";
  description: string;
}

interface DocumentReportContextValue {
  loading: boolean;
  error: string | null;
  submit: (values: SubmitValues) => Promise<void>;
  cancel: () => void;
}

const DocumentReportContext = createContext<
  DocumentReportContextValue | undefined
>(undefined);

interface DocumentReportProviderProps {
  documentId: string;
  children: React.ReactNode;
}

export function DocumentReportProvider({
  documentId,
  children,
}: DocumentReportProviderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  const submit = useCallback(
    async (values: SubmitValues) => {
      if (!documentId || !values.reason) return;
      setLoading(true);
      setError(null);

      const payload: CreateReportRequest = {
        documentId,
        reason: values.reason as ReportReason,
        description: values.description.trim() || null,
      };

      try {
        const res = await createDocumentReport(payload);

        if (!res?.success) {
          const msg = res?.message ?? "Failed to submit report";
          setError(msg);
          showToast(toast.error("Failed", msg));
          return;
        }

        showToast(toast.success("Success", "Report submitted successfully."));
        router.push(`/docs-view/${documentId}`);
      } catch (err: any) {
        if (err instanceof ApiError && err.isHandledGlobally) {
          setLoading(false);
          return;
        }

        const msg = typeof err?.message === "string" ? err.message : "Error";
        setError(msg);
        showToast(toast.error("Error", msg));
      } finally {
        setLoading(false);
      }
    },
    [documentId, router, showToast],
  );

  const cancel = useCallback(() => router.back(), [router]);

  const value = useMemo(
    () => ({ loading, error, submit, cancel }),
    [loading, error, submit, cancel],
  );

  return (
    <DocumentReportContext.Provider value={value}>
      {children}
    </DocumentReportContext.Provider>
  );
}

export function useDocumentReport() {
  const ctx = useContext(DocumentReportContext);
  if (!ctx) throw new Error("Inside Provider only");
  return ctx;
}
