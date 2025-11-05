"use client";
import React from "react";
import { useImportHistory } from "../provider";
import s from "../styles.module.css";

export default function Pagination() {
  const { data, filters, gotoPage } = useImportHistory();
  const total = data?.total ?? 0;
  const { page, pageSize } = filters;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className={s.pager}>
      <div className="text-sm text-gray-600">Tổng: {total}</div>
      <div className="flex gap-2">
        <button className={s.btn} onClick={()=> gotoPage(page-1)} disabled={page<=1}>Prev</button>
        <span className="text-sm text-align-center">{page} / {totalPages}</span>
        <button className={s.btn} onClick={()=> gotoPage(page+1)} disabled={page>=totalPages}>Next</button>
      </div>
    </div>
  );
}
