"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useImportEvents } from "../provider";

async function fetchImportDetail(id: string) {
  const qs = new URLSearchParams({ id });
  const r = await fetch(`/api/org-admin/imports?${qs.toString()}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`detail ${r.status}`);
  return r.json();
}

function percent(p: number, t: number) {
  if (!t || t <= 0) return 0;
  return Math.min(100, Math.round((p * 100) / t));
}

export default function DetailClient() {
  const p = useParams<{ id: string | string[] }>();
  const id = useMemo(() => (Array.isArray(p?.id) ? p!.id[0] : p?.id) ?? "", [p]);

  const [state, setState] = useState<any>({
    id: "", fileName: "", createdAt: "", createdBy: "",
    status: "WAITING",
    totalRows: 0, processedRows: 0, successCount: 0, failureCount: 0,
    percent: 0,
    results: [] as any[],
  });

  // initial load
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const d = await fetchImportDetail(id);
        setState((prev: any) => ({
          ...prev,
          ...d,
          percent: percent(d.processedRows ?? 0, d.totalRows ?? 0),
          results: Array.isArray(d.results) ? d.results : [],
        }));
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  // handle progress + row updates
  const onProgress = useCallback((u: any) => {
    setState((prev: any) => {
      const processed = u.processedRows ?? prev.processedRows;
      const total = u.totalRows ?? prev.totalRows;
      return {
        ...prev,
        ...u,
        percent: percent(processed, total),
      };
    });
  }, []);

  const onRow = useCallback((row: any) => {
    setState((prev: any) => {
      // replace by row number if existed, else append
      const idx = prev.results.findIndex((r: any) => r.row === row.row);
      const results = [...prev.results];
      if (idx >= 0) results[idx] = row;
      else results.push(row);

      const processed = row.processedRows ?? prev.processedRows;
      const total = row.totalRows ?? prev.totalRows;
      return {
        ...prev,
        results,
        processedRows: processed,
        totalRows: total,
        successCount: row.successCount ?? prev.successCount,
        failureCount: row.failureCount ?? prev.failureCount,
        percent: percent(processed, total),
        status: row.status ?? prev.status,
      };
    });
  }, []);

  useImportEvents(id, onProgress, onRow);

  const csvHref = useMemo(() => {
    const qs = new URLSearchParams({ id, download: "csv" });
    return `/api/org-admin/imports?${qs.toString()}`;
  }, [id]);

  const statusColor =
    state.status === "COMPLETED" ? "text-green-700"
    : state.status === "FAILED" ? "text-red-700"
    : "text-blue-700";

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/org-admin/imports" className="inline-flex items-center px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
          ← Back to imports
        </Link>
      </div>

      <h1 className="text-xl font-bold">Import #{id || "…"}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div><div className="text-sm text-gray-500">File</div><div className="font-medium">{state.fileName || "—"}</div></div>
        <div><div className="text-sm text-gray-500">Created at</div><div className="font-medium">{state.createdAt ? new Date(state.createdAt).toLocaleString() : "—"}</div></div>
        <div><div className="text-sm text-gray-500">By</div><div className="font-medium">{state.createdBy || "—"}</div></div>
        <div><div className="text-sm text-gray-500">Status</div><div className={`font-medium ${statusColor}`}>{state.status}</div></div>
      </div>

      <div>
        <div>Progress: {state.percent}% ({state.processedRows}/{state.totalRows})</div>
        <div>Success: {state.successCount} — Failed: {state.failureCount}</div>
        <div className="w-full bg-gray-200 h-2 rounded mt-2">
          <div className="h-2 bg-blue-600 rounded" style={{ width: `${state.percent}%` }} />
        </div>
        <div className="mt-3">
          <a className="inline-flex items-center rounded px-3 py-1.5 border text-sm hover:bg-gray-50" href={csvHref}>
            ⬇︎ Download result (.csv)
          </a>
        </div>
      </div>

      <div>
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
          <div className="text-sm text-gray-500">Waiting for results…</div>
        )}
      </div>
    </div>
  );
}