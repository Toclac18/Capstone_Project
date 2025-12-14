"use client";
import { useParams } from "next/navigation";
import { DocumentDetail } from "./_components/DocumentDetail";

export default function DocumentDetailPage() {
  const params = useParams();
  const documentId = params?.id as string;

  if (!documentId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Document ID is required</p>
      </div>
    );
  }

  return <DocumentDetail documentId={documentId} />;
}

