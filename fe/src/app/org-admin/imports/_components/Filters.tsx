"use client";
import { useState } from "react";
import s from "../styles.module.css";
import { useImportHistory } from "../provider";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All status" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

export default function Filters() {
  const { filters, setFilters, loading } = useImportHistory();
  const [q, setQ] = useState(filters.q);
  const [status, setStatus] = useState(filters.status);

  const applyFilters = () => {
    setFilters({
      ...filters,
      q,
      status,
      page: 1, // reset về trang 1 khi filter
    });
  };

  const clearFilters = () => {
    setQ("");
    setStatus("ALL");
    setFilters({
      ...filters,
      q: "",
      status: "ALL",
      page: 1,
    });
  };

  return (
    <div className={s.toolbar}>
      <div className={s.toolbarLeft}>
        <div className={s.searchBox}>
          <span className={s.searchIcon}>🔍</span>
          <input
            className={s.input}
            placeholder="Search by file, admin, notes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className={s.toolbarRight}>
        <div className={s.fieldGroup}>
          {/* <label className={s.fieldLabel}>Status</label> */}
          <select
            className={s.select}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={s.btn}
          disabled={loading}
          onClick={applyFilters}
        >
          {loading ? "Filtering…" : "Apply"}
        </button>

        <button
          type="button"
          className={s.btnGhost}
          disabled={loading}
          onClick={clearFilters}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
