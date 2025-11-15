// src/app/docs-view/[id]/_components/ClientPdf.tsx
"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
});

export default function ClientPdf() {
  return <PdfViewer />;
}
