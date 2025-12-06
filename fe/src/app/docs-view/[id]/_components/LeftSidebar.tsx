"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function LeftSidebar() {
  const { detail, page, setPage, numPages } = useDocsView();

  if (!detail) {
    return null;
  }

  const totalPages = numPages || 1;

  // ✅ Debug: xem URL thực tế là gì
  console.log("LeftSidebar fileUrl = ", detail.fileUrl);

  // ✅ Nếu chưa có URL thì chưa render Document, tránh lỗi "Failed to fetch"
  if (!detail.fileUrl) {
    return (
      <aside className={styles.leftSidebar}>
        <div className={styles.leftHeaderRow}>
          <div className={styles.leftHeader}>Pages</div>
          <div className={styles.pageJump}>
            <span>{page}</span>
            <span className={styles.pageJumpTotal}>/ {totalPages}</span>
          </div>
        </div>
        <div className={styles.pageThumbList}>
          <div className={styles.loading}>Loading PDF URL…</div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={styles.leftSidebar}>
      <div className={styles.leftHeaderRow}>
        <div className={styles.leftHeader}>Pages</div>
        <div className={styles.pageJump}>
          <span>{page}</span>
          <span className={styles.pageJumpTotal}>/ {totalPages}</span>
        </div>
      </div>

      <div className={styles.pageThumbList}>
        <Document
          // dùng object cho rõ ràng
          file={{ url: detail.fileUrl }}
          loading={<div className={styles.loading}>Loading pages…</div>}
          error={<div className={styles.loading}>Failed to load pages</div>}
          onLoadError={(err) => {
            console.error("LeftSidebar PDF load error:", err, detail.fileUrl);
          }}
        >
          {Array.from({ length: totalPages }, (_, idx) => {
            const pageNumber = idx + 1;
            const isActive = pageNumber === page;

            return (
              <div
                key={pageNumber}
                className={isActive ? styles.pageThumbActive : styles.pageThumb}
                onClick={() => setPage(pageNumber)}
              >
                <div className={styles.pageThumbPage}>
                  <Page
                    pageNumber={pageNumber}
                    width={160}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </div>
                <div className={styles.pageThumbNumber}>{pageNumber}</div>
              </div>
            );
          })}
        </Document>
      </div>
    </aside>
  );
}
