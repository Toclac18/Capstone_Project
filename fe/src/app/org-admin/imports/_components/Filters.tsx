"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import s from "../styles.module.css";
import { useImportHistory } from "../provider";

export default function Filters() {
  const { filters, setFilters, loading } = useImportHistory();
  const [q, setQ] = useState(filters.q);

  const handleSearch = () => {
    setFilters({ q, page: 1 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQ(value);
    // Auto search when clearing
    if (value === "") {
      setFilters({ q: "", page: 1 });
    }
  };

  return (
    <div className={s.toolbar}>
      <div className={s.searchBox}>
        <Search size={16} className={s.searchIcon} />
        <input
          className={s.input}
          placeholder="Search by file name..."
          value={q}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button
        type="button"
        className={s.btnSearch}
        onClick={handleSearch}
        disabled={loading}
      >
        Search
      </button>
    </div>
  );
}
