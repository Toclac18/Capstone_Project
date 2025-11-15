// src/app/docs-view/[id]/_components/PdfViewer.tsx
"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function PdfViewer() {
  const {
    detail,
    page,
    scale,
    setNumPages,
    redeemed,
    openRedeemModal,
    onPageText,
  } = useDocsView();

  if (!detail) return null;

  const blurred = detail.isPremium && !redeemed;

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageText = (textContent: any) => {
    const items = textContent?.items ?? [];
    const text = items.map((item: any) => item?.str ?? "").join(" ");
    onPageText(page, text);
  };

  return (
    <div className={styles.viewerRoot}>
      <div className={styles.viewerWrap}>
        <div className={blurred ? styles.viewerBlur : undefined}>
          <Document
            file={detail.fileUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={<div className={styles.pdfLoading}>Loading PDF…</div>}
            error={<div className={styles.pdfError}>Failed to load PDF</div>}
          >
            <Page
              pageNumber={page}
              scale={scale}
              onGetTextSuccess={handlePageText}
            />
          </Document>
        </div>

        {/* Overlay khi là premium mà chưa redeem */}
        {blurred && (
          <div className={styles.premiumOverlay}>
            <div className={styles.premiumCard}>
              <div className={styles.premiumBadge}>Premium</div>
              <h3 className={styles.premiumTitle}>Premium document</h3>
              <p className={styles.premiumText}>
                Redeem to read this document. It will be saved in your library
                and you won&apos;t need to redeem it again.
              </p>
              <button className={styles.btnRedeem} onClick={openRedeemModal}>
                Redeem
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
