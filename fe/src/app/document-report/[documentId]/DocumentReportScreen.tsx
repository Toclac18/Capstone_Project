// src/app/document-report/[documentId]/DocumentReportScreen.tsx
"use client";

import styles from "./styles.module.css";
import { ReportForm } from "./ReportForm";
import {
  DocumentReportProvider,
  useDocumentReport,
  SubmitValues,
} from "./provider";

interface DocumentReportScreenProps {
  documentId: string;
}

function DocumentReportContent({ documentId }: { documentId: string }) {
  const { loading, error, submit, cancel } = useDocumentReport();

  const handleSubmit = async (values: SubmitValues) => {
    await submit(values);
  };

  if (!documentId) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageError}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Missing Document ID
          </h2>
          <p>Please go back and open this page from a document detail.</p>
          <button
            onClick={() => cancel()}
            className="mt-4 text-blue-500 hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <ReportForm
        documentId={documentId}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onCancel={cancel}
      />
    </div>
  );
}

export function DocumentReportScreen({
  documentId,
}: DocumentReportScreenProps) {
  return (
    <DocumentReportProvider documentId={documentId}>
      <DocumentReportContent documentId={documentId} />
    </DocumentReportProvider>
  );
}
