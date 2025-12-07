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
    await submit(values); // provider tự xử lý toast + redirect
  };

  if (!documentId) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.pageContainer}>
          <div className={styles.pageError}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Missing document ID
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Please go back and open this page from a document detail screen.
            </p>
            <button
              onClick={() => cancel()}
              className="mt-4 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageContainer}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerMain}>
            <div className={styles.headerIcon}>
              <span>!</span>
            </div>
            <div>
              <div className={styles.titleRow}>
                <h1 className={styles.pageTitle}>DOCUMENT REPORT</h1>
                <span className={styles.stepPill}>Enhance quality</span>
              </div>
              <p className={styles.pageSubtitle}>
                Help us keep the library safe and high–quality. Your report is
                anonymous and will only be used to review this document.
              </p>
            </div>
          </div>

          <div className={styles.metaBox}>
            <p className={styles.metaLabel}>Note!</p>
            <div className={styles.metaDocId}>
              <span className={styles.metaDocIdLabel}>
                This report is sent as anonymous
              </span>
            </div>
            <ul className={styles.tipList}>
              <li>Be specific about what is wrong.</li>
              <li>Mention the original source for copyright issues.</li>
              <li>Do not include sensitive personal information.</li>
            </ul>
          </div>
        </header>

        <div className={styles.divider} />

        {/* Form section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Report details</h2>
            <p className={styles.sectionSubtitle}>
              Choose a reason and optionally describe the issue so our team can
              review it faster.
            </p>
          </div>

          <ReportForm
            documentId={documentId}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onCancel={cancel}
          />
        </section>
      </div>
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
