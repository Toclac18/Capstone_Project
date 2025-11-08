"use client";
import StatusBadge from "../../_components/StatusBadge";
import { useImportDetail } from "../provider";
import s from "../styles.module.css";

export default function MetaGrid() {
  const { data } = useImportDetail();
  if (!data) return null;
  return (
    <div className={s.metaGrid}>
      <div className={s.card}>
        <div><span className={s.kv}>File:</span> {data.fileName}</div>
        <div><span className={s.kv}>Created at:</span> {data.createdAt}</div>
        <div><span className={s.kv}>By:</span> {data.createdBy}</div>
      </div>
      <div className={s.card}>
        <div><span className={s.kv}>Rows:</span> {data.totalRows}</div>
        <div><span className={s.kv}>Success:</span> {data.successCount}</div>
        <div><span className={s.kv}>Failed:</span> {data.failureCount}</div>
      </div>
      <div className="flex items-center gap-8">
        <div className="text-gray-600">Status:</div>
        <StatusBadge status={data.status} />
      </div>
    </div>
  );
}