"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import styles from "../styles.module.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface SimplePdfViewerProps {
  fileUrl: string;
}

export function SimplePdfViewer({ fileUrl }: SimplePdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(false);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  if (error) {
    return (
      <div className={styles["pdf-error-box"]}>
        <p>Failed to load PDF</p>
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={styles["preview-link"]}>
          Open in new tab
        </a>
      </div>
    );
  }

  return (
    <div className={styles["pdf-viewer-container"]}>
      {/* Controls */}
      <div className={styles["pdf-controls"]}>
        <div className={styles["pdf-nav"]}>
          <button onClick={goToPrevPage} disabled={pageNumber <= 1} className={styles["pdf-nav-btn"]}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className={styles["pdf-page-info"]}>
            {pageNumber} / {numPages || "..."}
          </span>
          <button onClick={goToNextPage} disabled={pageNumber >= numPages} className={styles["pdf-nav-btn"]}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className={styles["pdf-zoom"]}>
          <button onClick={zoomOut} disabled={scale <= 0.5} className={styles["pdf-nav-btn"]}>
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className={styles["pdf-zoom-info"]}>{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} disabled={scale >= 2.5} className={styles["pdf-nav-btn"]}>
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className={styles["pdf-content"]}>
        {loading && (
          <div className={styles["pdf-loading-box"]}>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading PDF...</p>
          </div>
        )}
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
