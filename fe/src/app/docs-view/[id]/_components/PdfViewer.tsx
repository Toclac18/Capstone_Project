// src/app/docs-view/[id]/_components/PdfViewer.tsx
"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useDocsView } from "../DocsViewProvider";
import styles from "../styles.module.css";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DocumentComponent = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  {
    ssr: false,
    loading: () => <div className={styles.loading}>Loading PDF…</div>,
  },
);

const PageComponent = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  {
    ssr: false,
  },
);

export default function PdfViewer() {
  const { detail, page, setNumPages, scale, onPageText, redeemed, redeem } =
    useDocsView();

  if (!detail) return null;

  const onRenderSuccess = async (pageObj: any) => {
    try {
      const tc = await pageObj.getTextContent();
      const text = tc.items.map((i: any) => i.str).join(" ");
      onPageText(pageObj.pageNumber, text);
    } catch {}
  };

  useEffect(() => {}, [page]);

  const blurred = detail.isPremium && !redeemed;

  return (
    <div className={styles.viewerWrap}>
      <div className={blurred ? styles.viewerBlur : undefined}>
        <DocumentComponent
          file={detail.fileUrl}
          onLoadSuccess={({ numPages }: any) => setNumPages(numPages)}
        >
          <PageComponent
            pageNumber={page}
            scale={scale}
            renderTextLayer
            renderAnnotationLayer
            onRenderSuccess={onRenderSuccess}
          />
        </DocumentComponent>
      </div>

      {blurred && (
        <div className={styles.premiumOverlay}>
          <div className={styles.overlayBox}>
            <div className={styles.overlayBadge}>Premium</div>
            <div className={styles.overlayTitle}>Premium document</div>
            <div className={styles.overlayHint}>
              Redeem to read this document.
            </div>
            <div className={styles.overlayCTA}>
              <button className={styles.btnRedeem} onClick={redeem}>
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
