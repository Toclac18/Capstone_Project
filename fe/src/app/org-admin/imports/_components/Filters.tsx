"use client";
import { useState } from "react";
import s from "../styles.module.css";
import { useImportHistory } from "../provider";

export default function Filters() {
  const { filters, setFilters, loading } = useImportHistory();
  const [q, setQ] = useState(filters.q);
  const [status, setStatus] = useState(filters.status);

  return (
    <div className={s.toolbar}>
      <input
        className={s.input}
        placeholder="Search file / creator"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select
        className={s.input}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        {[
          "ALL",
          "PENDING",
          "PROCESSING",
          "COMPLETED",
          "FAILED",
          "CANCELLED",
        ].map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      <button
        className={s.btn}
        disabled={loading}
        onClick={() => setFilters({ q, status, page: 1 })}
      >
        Filters
      </button>
    </div>
  );
}
