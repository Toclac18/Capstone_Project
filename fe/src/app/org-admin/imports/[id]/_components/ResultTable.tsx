// src/app/org-admin/imports/[id]/_components/ResultTable.tsx
"use client";

import { useImportDetail } from "../provider";
import s from "../styles.module.css";

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "APPROVED":
      return s.statusApproved;
    case "PENDING":
      return s.statusPending;
    default:
      return s.statusRejected;
  }
}

export default function ResultTable() {
  const { rows } = useImportDetail();

  if (!rows || rows.items.length === 0) {
    return (
      <section className={s.tableSection}>
        <h2 className={s.tableTitle}>Import results</h2>
        <div className={s.emptyState}>Waiting for results…</div>
      </section>
    );
  }

  return (
    <section className={s.tableSection}>
      <h2 className={s.tableTitle}>
        Import results ({rows.total} {rows.total === 1 ? "record" : "records"})
      </h2>

      <div className={s.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Full name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Invited at</th>
              <th>Responded at</th>
            </tr>
          </thead>
          <tbody>
            {rows.items.map((e, idx) => (
              <tr key={e.enrollmentId ?? idx}>
                <td>{idx + 1}</td>
                <td>{e.memberFullName || "—"}</td>
                <td>{e.memberEmail}</td>
                <td>
                  <span className={statusClass(e.status)}>{e.status}</span>
                </td>
                <td>{formatDate(e.invitedAt)}</td>
                <td>{formatDate(e.respondedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
