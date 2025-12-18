"use client";
import { useState } from "react";
import { SearchProvider } from "./provider";
import styles from "./styles.module.css";
import SearchToolbar from "./_components/SearchToolbar";
import DocumentList from "./_components/DocumentList";
import Pagination from "./_components/Pagination";
import FilterModal from "./_components/FilterModal";
import { Search } from "lucide-react";

export default function SearchPage() {
  const [open, setOpen] = useState(false);

  return (
    <div data-search-scope>
      <SearchProvider>
        <main className={styles.container}>
          <header className={styles.header}>
            <div className={styles.headerIcon}>
              <Search size={28} />
            </div>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Search Documents</h1>
              <p className={styles.subtitle}>
                Find academic resources, research papers, and study materials
              </p>
            </div>
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
