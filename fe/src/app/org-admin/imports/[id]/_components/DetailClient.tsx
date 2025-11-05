"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

// === helpers: fetch detail & SSE ===
async function fetchImportDetail(id: string) {
  const qs = new URLSearchParams({ id });
  const r = await fetch(`/api/org-admin/imports?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`detail ${r.status}`);
  return r.json();
}

function useImportEvents(
  id: string,
  onUpdate: (updater: (prev: any) => any) => void,
  onComplete?: () => void,
) {
  useEffect(() => {
    if (!id) return;
    const es = new EventSource(`/api/org-admin/imports/${id}/events`);
    es.addEventListener("progress", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        onUpdate((prev) => ({ ...prev, ...data }));
      } catch {}
    });
    es.addEventListener("complete", () => {
      onComplete?.();
      es.close();
    });
    es.onerror = () => {};
    return () => es.close();
  }, [id, onUpdate, onComplete]);
}

function computePercent(processed?: number, total?: number) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round(((processed ?? 0) * 100) / total));
}

// === optional small presentational components (nếu bạn đã có thì dùng của bạn) ===
function LabelVal({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function Badge({
  color = "gray",
  children,
}: {
  color?: "green" | "red" | "gray" | "blue";
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-sm ${map[color]}`}>
      {children}
    </span>
  );
}

export default function DetailClient() {
  const p = useParams<{ id: string | string[] }>();
  const id = useMemo(
    () => (Array.isArray(p?.id) ? p!.id[0] : p?.id) ?? "",
    [p],
  );

  const [state, setState] = useState<any>({
    status: "WAITING",
    processedRows: 0,
    totalRows: 0,
    successCount: 0,
    failureCount: 0,
    percent: 0,
    // meta:
    id: "",
    fileName: "",
    createdAt: "",
    createdBy: "",
    results: [] as any[],
  });

  // 1) Load detail khi mở trang
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const detail = await fetchImportDetail(id);
        setState((prev: any) => ({
          ...prev,
          ...detail,
          percent: computePercent(detail.processedRows, detail.totalRows),
          results: Array.isArray(detail.results) ? detail.results : [],
        }));
      } catch (e) {
        console.error("load detail error", e);
      }
    })();
  }, [id]);

  // 2) Realtime SSE
  const onSseUpdate = useCallback((updater: (prev: any) => any) => {
    setState((prev: any) => {
      const next = updater(prev);
      next.percent = computePercent(next.processedRows, next.totalRows);
      return next;
    });
  }, []);
  useImportEvents(id, onSseUpdate);

  // 3) Tải CSV
  const csvHref = useMemo(() => {
    const qs = new URLSearchParams({ id, download: "csv" });
    return `/api/org-admin/imports?${qs.toString()}`;
  }, [id]);

  const statusColor: "green" | "red" | "blue" | "gray" =
    state.status === "COMPLETED"
      ? "green"
      : state.status === "FAILED"
        ? "red"
        : state.status === "PROCESSING"
          ? "blue"
          : "gray";

  return (
    <div className="p-6">
      <div>
        <Link
          href="/org-admin/imports"
          className="inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          ← Back to Imports
        </Link>
      </div>
      <h1 className="text-xl font-bold">Import #{id || "…"}</h1>

      {/* Meta block */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LabelVal label="File">{state.fileName || "—"}</LabelVal>
        <LabelVal label="Created at">
          {state.createdAt ? new Date(state.createdAt).toLocaleString() : "—"}
        </LabelVal>
        <LabelVal label="By">{state.createdBy || "—"}</LabelVal>
        <LabelVal label="Status">
          <Badge color={statusColor}>{state.status}</Badge>
        </LabelVal>
      </div>

      {/* Progress block */}
      <div className="mt-6">
        <div>
          Progress: {state?.percent ?? 0}% ({state?.processedRows ?? 0}/
          {state?.totalRows ?? 0})
        </div>
        <div>
          Success: {state?.successCount ?? 0} — Failed:{" "}
          {state?.failureCount ?? 0}
        </div>
        <div className="mt-2 h-2 w-full rounded bg-gray-200">
          <div
            className="h-2 rounded bg-blue-600"
            style={{ width: `${state?.percent ?? 0}%` }}
          />
        </div>
        <div className="mt-3">
          <a
            className="inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            href={csvHref}
          >
            ⬇︎ Download result (.csv)
          </a>
        </div>
      </div>

      {/* Results table */}
      <div className="mt-8">
        {state.results?.length ? (
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">Full name</th>
                  <th className="px-3 py-2 text-left">Username</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Imported</th>
                  <th className="px-3 py-2 text-left">Email sent</th>
                  <th className="px-3 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {state.results.map((r: any) => (
                  <tr key={r.row} className="border-t">
                    <td className="px-3 py-2">{r.row}</td>
                    <td className="px-3 py-2">{r.fullName}</td>
                    <td className="px-3 py-2">{r.username}</td>
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2">{r.imported ? "✔" : "—"}</td>
                    <td className="px-3 py-2">{r.emailSent ? "✔" : "—"}</td>
                    <td className="px-3 py-2">{r.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm text-gray-500">No row results.</div>
        )}
      </div>
    </div>
  );
}
