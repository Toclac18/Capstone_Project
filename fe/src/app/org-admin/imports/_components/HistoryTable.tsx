"use client";
import Link from "next/link";
import React from "react";
import { useImportHistory } from "../provider";
import s from "../styles.module.css";
import StatusBadge from "./StatusBadge";

export default function HistoryTable() {
  const { data, loading } = useImportHistory();
  const rows = data?.items ?? [];
  return (
    <div className={s.tableWrap}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['File','Created at','By','Rows','✔︎','✖︎','Status',''].map(h=> <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={8}>Đang tải…</td></tr>
          ) : rows.length === 0 ? (
            <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={8}>Không có dữ liệu</td></tr>
          ) : rows.map(r => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">{r.fileName}</td>
              <td className="px-3 py-2">{r.createdAt}</td>
              <td className="px-3 py-2">{r.createdBy}</td>
              <td className={"px-3 py-2 "+s.cellLeft}>{r.totalRows}</td>
              <td className={"px-3 py-2 "+s.cellLeft}>{r.successCount}</td>
              <td className={"px-3 py-2 "+s.cellLeft}>{r.failureCount}</td>
              <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
              <td className="px-3 py-2"><Link className={s.link} href={`/org-admin/imports/${r.id}`}>Xem</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
