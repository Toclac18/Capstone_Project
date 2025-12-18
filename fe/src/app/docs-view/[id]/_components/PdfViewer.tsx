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
  const { detail, page, scale, setNumPages, onPageText, query } = useDocsView();

  if (!detail) return null;

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
    </div>
  );
}
