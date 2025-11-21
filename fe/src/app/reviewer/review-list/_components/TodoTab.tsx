"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getTodoDocuments,
  submitReview,
  type ReviewDocument,
} from "../api";
import { Pagination } from "@/components/ui/pagination";
import { ReviewModal } from "./ReviewModal";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/utils/format-date";
import { truncateText } from "@/utils/truncate-text";
import { Spinner } from "@/components/ui/spinner";
import styles from "../styles.module.css";

const ITEMS_PER_PAGE = 12;
const DESCRIPTION_MAX_LENGTH = 80;
const MAX_TAGS_DISPLAY = 3;

export function TodoTab() {
  const [documents, setDocuments] = useState<ReviewDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<ReviewDocument | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTodoDocuments({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      setDocuments(response.documents);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReviewClick = useCallback(async (document: ReviewDocument) => {
    setLoadingButtonId(document.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSelectedDocument(document);
      setIsReviewModalOpen(true);
    } finally {
      setLoadingButtonId(null);
    }
  }, []);

  const handleSubmitReview = useCallback(async (data: { action: "APPROVE" | "REJECT"; reportFile: File; documentId: string }) => {
    try {
      // Call API to submit review with file
      await submitReview(data.documentId, data.action, data.reportFile);
      
      // Refresh data
      await fetchData();
      
      showToast({
        type: 'success',
        title: 'Review Submitted',
        message: `Document has been ${data.action === "APPROVE" ? "approved" : "rejected"} successfully. The uploader has been notified.`,
        duration: 3000,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Review Failed',
        message: err instanceof Error ? err.message : 'Failed to submit review. Please try again.',
        duration: 3000,
      });
      throw err;
    }
  }, [fetchData, showToast]);

  if (loading) {
    return (
      <div className={styles["loading-container"]}>
        <p>Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["error-container"]}>
        <p>{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={styles["empty-container"]}>
        <p>No pending documents to review at this time.</p>
      </div>
    );
  }

  return (
    <div className={styles["tab-content"]}>
      <div className={styles["table-wrapper"]}>
        <div className={styles["table-container"]}>
          <table className={styles["table"]}>
            <thead className={styles["table-header"]}>
              <tr>
                <th className={styles["table-header-cell"]} style={{ width: "20%" }}>Title</th>
                <th className={styles["table-header-cell"]} style={{ width: "10%" }}>Type</th>
                <th className={styles["table-header-cell"]} style={{ width: "10%" }}>Domain</th>
                <th className={styles["table-header-cell"]} style={{ width: "12%" }}>Specialization</th>
                <th className={styles["table-header-cell"]} style={{ width: "15%" }}>Tags</th>
                <th className={styles["table-header-cell"]} style={{ width: "10%" }}>Uploader</th>
                <th className={styles["table-header-cell"]} style={{ width: "10%" }}>Date Upload</th>
                <th className={styles["table-header-cell"]} style={{ width: "13%" }}>Action</th>
              </tr>
            </thead>
            <tbody className={styles["table-body"]}>
              {documents.map((doc) => (
                <tr key={doc.id} className={styles["table-row"]}>
                  <td className={styles["table-cell"]}>
                    <div className={styles["table-cell-main"]}>
                      <Link href={`/docs-view/${doc.id}`} className={styles["document-link"]}>
                        {doc.documentTitle}
                      </Link>
                    </div>
                    {doc.description && (
                      <div className={styles["table-cell-secondary"]}>
                        {truncateText(doc.description, DESCRIPTION_MAX_LENGTH)}
                      </div>
                    )}
                  </td>
                  <td className={styles["table-cell"]}>
                    <span className={styles["table-cell-value"]}>{doc.documentType}</span>
                  </td>
                  <td className={styles["table-cell"]}>
                    <span className={styles["table-cell-value"]}>{doc.domain}</span>
                  </td>
                  <td className={styles["table-cell"]}>
                    {doc.specialization ? (
                      <span className={styles["table-cell-value"]}>{doc.specialization}</span>
                    ) : (
                      <span className={styles["text-muted"]}>—</span>
                    )}
                  </td>
                  <td className={styles["table-cell"]}>
                    {doc.tags && doc.tags.length > 0 ? (
                      <div className={styles["tags-list"]}>
                        {doc.tags.slice(0, MAX_TAGS_DISPLAY).map((tag, idx) => (
                          <span key={`${tag}-${idx}`} className={styles["tag"]}>
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > MAX_TAGS_DISPLAY && (
                          <span className={styles["tag-more"]}>+{doc.tags.length - MAX_TAGS_DISPLAY}</span>
                        )}
                      </div>
                    ) : (
                      <span className={styles["text-muted"]}>—</span>
                    )}
                  </td>
                  <td className={styles["table-cell"]}>
                    <span className={styles["table-cell-value"]}>{doc.uploaderName}</span>
                  </td>
                  <td className={styles["table-cell"]}>
                    <span className={styles["table-cell-value"]}>
                      {formatDate(doc.uploadedDate)}
                    </span>
                  </td>
                  <td className={styles["table-cell"]}>
                    <div className={styles["action-cell"]}>
                      <button
                        type="button"
                        onClick={() => handleReviewClick(doc)}
                        disabled={loadingButtonId === doc.id}
                        className={styles["action-button-review"]}
                      >
                        {loadingButtonId === doc.id ? (
                          <>
                            <Spinner size="md" className="mr-2" />
                            Reviewing...
                          </>
                        ) : (
                          "Review"
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className={styles["pagination-container"]}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}
