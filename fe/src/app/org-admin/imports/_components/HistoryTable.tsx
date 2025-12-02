"use client";
import Link from "next/link";
import s from "../styles.module.css";
import { useImportHistory } from "../provider";
import StatusBadge from "./StatusBadge";

export default function HistoryTable() {
  const { data, loading } = useImportHistory();
  const rows = data?.items ?? [];

  const isEmpty = !loading && rows.length === 0;

  if (loading && rows.length === 0) {
    return (
      <div className={s.tableWrap}>
        <div className={s.emptyState}>
          <div className={s.emptyTitle}>Loading import history...</div>
          <p className={s.emptySubtitle}>Please wait some minutes!</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={s.tableWrap}>
        <div className={s.emptyState}>
          <div className={s.emptyTitle}>No import batch has been executed</div>
          <Link href="/org-admin/imports/new" className={s.emptyCta}>
            + New import
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>File</th>
            <th>Created at</th>
            <th>Source</th>
            <th>Admin</th>
            <th>Notes</th>
            <th className={s.cellRight}>Total</th>
            <th className={s.cellRight}>Success</th>
            <th className={s.cellRight}>Failed</th>
            <th className={s.cellRight}>Skipped</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => {
            const total = r.totalEmails ?? r.totalRows ?? r.total ?? 0;
            const success = r.successCount ?? r.success ?? r.successEmails ?? 0;
            const failed = r.failedCount ?? r.failureCount ?? r.failCount ?? 0;
            const skipped = r.skippedCount ?? r.skipped ?? r.skipCount ?? 0;
            const admin = r.adminName ?? r.createdBy ?? "-";
            const notes = r.notes ?? "";
            const source = r.importSource ?? r.source ?? "EXCEL";
            const created = r.importedAt || r.createdAt || r.created_at || "-";

            return (
              <tr key={r.id} className={s.tableRow}>
                <td>
                  <div className={s.fileCell}>
                    <div className={s.fileAvatar}>
                      <span className={s.fileAvatarText}>
                        {source === "EXCEL" ? "XLS" : "M"}
                      </span>
                    </div>
                    <div className={s.fileMeta}>
                      <div className={s.fileName}>
                        {r.fileName || "Manual import"}
                      </div>
                      {notes && (
                        <div className={s.fileNote} title={notes}>
                          {notes}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className={s.subText}>{created}</div>
                </td>
                <td>
                  <span className={s.chip}>
                    {source === "EXCEL" ? "Excel" : source}
                  </span>
                </td>
                <td>
                  <div className={s.mainText}>{admin}</div>
                </td>
                <td>
                  <div className={s.subText}>
                    {notes || <span className={s.muted}>—</span>}
                  </div>
                </td>
                <td className={s.cellRight}>
                  <span className={s.metricTotal}>{total}</span>
                </td>
                <td className={s.cellRight}>
                  <span className={s.metricSuccess}>{success}</span>
                </td>
                <td className={s.cellRight}>
                  <span className={s.metricFailed}>{failed}</span>
                </td>
                <td className={s.cellRight}>
                  <span className={s.metricSkipped}>{skipped}</span>
                </td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className={s.cellAction}>
                  <Link className={s.link} href={`/org-admin/imports/${r.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
