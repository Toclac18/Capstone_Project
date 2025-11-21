"use client";
import { useState } from "react";
import { SearchProvider } from "./SearchProvider";
import styles from "./styles.module.css";
import SearchToolbar from "./_components/SearchToolbar";
import DocumentList from "./_components/DocumentList";
import Pagination from "./_components/Pagination";
import FilterModal from "./_components/FilterModal";

export default function SearchPage() {
  const [open, setOpen] = useState(false);

  return (
    <div data-search-scope>
      {" "}
      {/* ✅ scope CSS cho riêng trang search */}
      <SearchProvider>
        <main className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>Library Search</h1>
            <p className={styles.subtitle}>
              Studocu-style listing with filters, pagination, and on-page search
            </p>
          </header>

          <SearchToolbar onOpenFilter={() => setOpen(true)} />
          <DocumentList />
          <Pagination />

          <FilterModal open={open} onClose={() => setOpen(false)} />
        </main>
      </SearchProvider>
    </div>
  );
}
