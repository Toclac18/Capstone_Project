"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getReviewedHistory, type ReviewHistory } from "../api";
import type { ReviewHistoryQueryParams } from "@/types/review";
import { HistoryFilters } from "./HistoryFilters";
import { Pagination } from "@/components/ui/pagination";
import { formatDate, formatTime } from "@/utils/format-date";
import styles from "../styles.module.css";
import { CheckCircle, XCircle } from "lucide-react";

const ITEMS_PER_PAGE = 12;
const MAX_TAGS_DISPLAY = 3;

export function ReviewedHistoryTab() {
  const [reviews, setReviews] = useState<ReviewHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ReviewHistoryQueryParams>({
    page: 1,
    limit: ITEMS_PER_PAGE,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReviewedHistory({
        ...filters,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      setReviews(response.reviews);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review history");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFiltersChange = useCallback((newFilters: ReviewHistoryQueryParams) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const getActionIcon = useCallback((action: string) => {
    switch (action) {
      case "APPROVE":
        return <CheckCircle className={styles["action-icon-approve"]} />;
      case "REJECT":
        return <XCircle className={styles["action-icon-reject"]} />;
      default:
        return null;
    }
  }, []);

  const getActionLabel = useCallback((action: string) => {
    switch (action) {
      case "APPROVE":
        return "Approved";
      case "REJECT":
        return "Rejected";
      case "REQUEST_REVIEW":
        return "Requested Re-review";
      default:
        return action;
    }
  }, []);

  const getActionClass = useCallback((action: string) => {
    switch (action) {
      case "APPROVE":
        return styles["action-approve"];
      case "REJECT":
        return styles["action-reject"];
      default:
        return styles["action-default"];
    }
  }, []);

  return (
    <div className={styles["tab-content"]}>
      <HistoryFilters onFiltersChange={handleFiltersChange} loading={loading} />

      {loading ? (
        <div className={styles["loading-container"]}>
          <p>Loading review history...</p>
        </div>
      ) : error ? (
        <div className={styles["error-container"]}>
          <p>{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className={styles["empty-container"]}>
          <p>No review history available.</p>
        </div>
      ) : (
        <>
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
                    <th className={styles["table-header-cell"]} style={{ width: "13%" }}>Review Date</th>
                  </tr>
                </thead>
                <tbody className={styles["table-body"]}>
                  {reviews.map((review) => (
                    <tr key={review.id} className={styles["table-row"]}>
                      <td className={styles["table-cell"]}>
                        <div className={styles["table-cell-main"]}>
                          <Link href={`/docs-view/${review.documentId}`} className={styles["document-link"]}>
                            {review.documentTitle}
                          </Link>
                        </div>
                        <div className={styles["review-action-badge"]}>
                          {getActionIcon(review.action)}
                          <span className={getActionClass(review.action)}>
                            {getActionLabel(review.action)}
                          </span>
                        </div>
                      </td>
                      <td className={styles["table-cell"]}>
                        {review.documentType ? (
                          <span className={styles["table-cell-value"]}>{review.documentType}</span>
                        ) : (
                          <span className={styles["text-muted"]}>—</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {review.domain ? (
                          <span className={styles["table-cell-value"]}>{review.domain}</span>
                        ) : (
                          <span className={styles["text-muted"]}>—</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {review.specialization ? (
                          <span className={styles["table-cell-value"]}>{review.specialization}</span>
                        ) : (
                          <span className={styles["text-muted"]}>—</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {review.tags && review.tags.length > 0 ? (
                          <div className={styles["tags-list"]}>
                            {review.tags.slice(0, MAX_TAGS_DISPLAY).map((tag, idx) => (
                              <span key={`${tag}-${idx}`} className={styles["tag"]}>
                                {tag}
                              </span>
                            ))}
                            {review.tags.length > MAX_TAGS_DISPLAY && (
                              <span className={styles["tag-more"]}>+{review.tags.length - MAX_TAGS_DISPLAY}</span>
                            )}
                          </div>
                        ) : (
                          <span className={styles["text-muted"]}>—</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        <span className={styles["table-cell-value"]}>
                          {review.uploaderName || review.reviewerName}
                        </span>
                      </td>
                      <td className={styles["table-cell"]}>
                        {review.uploadedDate ? (
                          <span className={styles["table-cell-value"]}>
                            {formatDate(review.uploadedDate)}
                          </span>
                        ) : (
                          <span className={styles["text-muted"]}>—</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        <span className={styles["table-cell-value"]}>
                          {formatDate(review.reviewDate)}
                        </span>
                        {review.verificationTime && (
                          <div className={styles["verification-time"]}>
                            Verified: {formatTime(review.verificationTime)}
                          </div>
                        )}
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
        </>
      )}
    </div>
  );
}
