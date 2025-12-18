// src/app/org-admin/imports/[id]/_components/ResultTable.tsx
"use client";

import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useImportDetail } from "../provider";
import s from "../styles.module.css";

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "SUCCESS":
      return <CheckCircle size={16} className={s.iconSuccess} />;
    case "FAILED":
      return <XCircle size={16} className={s.iconFailed} />;
    case "SKIPPED":
      return <AlertCircle size={16} className={s.iconSkipped} />;
    default:
      return null;
  }
}

function getRowClass(status: string) {
  switch (status) {
    case "FAILED":
      return s.rowFailed;
    case "SKIPPED":
      return s.rowSkipped;
    default:
      return "";
  }
}

export default function ResultTable() {
  const { rows } = useImportDetail();

  if (!rows || rows.items.length === 0) {
    return (
      <section className={s.tableSection}>
        <h2 className={s.tableTitle}>Import Results</h2>
        <div className={s.emptyState}>
          No detailed results available for this import batch.
          <br />
          <span style={{ fontSize: "12px", marginTop: "8px", display: "block" }}>
            (Only imports created after the latest update have detailed results)
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className={s.tableSection}>
      <h2 className={s.tableTitle}>
        Import Results ({rows.total} {rows.total === 1 ? "email" : "emails"})
      </h2>

      <div className={s.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.items.map((item, idx) => (
              <tr key={item.id ?? idx} className={getRowClass(item.status)}>
                <td>{idx + 1}</td>
                <td>{item.email}</td>
                <td>
                  <span className={s.statusCell}>
                    <StatusIcon status={item.status} />
                    {item.status}
                  </span>
                </td>
                <td>{item.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
