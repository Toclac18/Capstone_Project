// src/app/docs-view/[id]/_components/PdfViewer.tsx
"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type TextRenderer = (textItem: { str: string }) => string;

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeTextRenderer(query: string): TextRenderer {
  const q = query.trim();
  if (!q) {
    return ({ str }: { str: string }) => str;
  }

  const regex = new RegExp(escapeRegExp(q), "gi");

  return ({ str }: { str: string }) => {
    if (!str) return str;

    return str.replace(
      regex,
      (match: string) => `<mark class="pdf-highlight">${match}</mark>`,
    );
  };
}

export default function PdfViewer() {
  const {
    detail,
    page,
    scale,
    setNumPages,
    redeemed,
    openRedeemModal,
    onPageText,
    query,
  } = useDocsView();

  if (!detail) return null;

  const blurred = detail.isPremium && !redeemed;

  const textRenderer = makeTextRenderer(query);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageText = (textContent: any) => {
    const items = textContent?.items ?? [];
    const text = items.map((i: any) => i?.str ?? "").join(" ");
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
              customTextRenderer={textRenderer}
            />
          </Document>
        </div>

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
