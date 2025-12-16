"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getReviewedHistory, type ReviewHistory } from "../api";
import type { ReviewHistoryQueryParams } from "@/types/review";
import { HistoryFilters } from "./HistoryFilters";
import { ReviewHistoryDetailModal } from "./ReviewHistoryDetailModal";
import { Pagination } from "@/components/ui/pagination";
import { formatDate, formatTime } from "@/utils/format-date";
import { getDocumentTypes, getDomains } from "@/services/upload-documents.service";
import styles from "../styles.module.css";
import { CheckCircle, XCircle, Clock, AlertCircle, Eye } from "lucide-react";

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
  const [documentTypes, setDocumentTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [domains, setDomains] = useState<Array<{ id: string; name: string }>>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ReviewHistory | null>(null);

  // Load document types and domains for mapping
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [types, domainsData] = await Promise.all([
          getDocumentTypes(),
          getDomains(),
        ]);
        setDocumentTypes(types);
        setDomains(domainsData);
        setOptionsLoaded(true);
      } catch (error) {
        console.error("Failed to load filter options:", error);
        setOptionsLoaded(true); // Set to true even on error to prevent infinite waiting
      }
    };
    loadOptions();
  }, []);

  // Map frontend filters to backend API parameters
  const mapFiltersToApiParams = useCallback((frontendFilters: ReviewHistoryQueryParams) => {
    const params: Parameters<typeof getReviewedHistory>[0] = {
      page: frontendFilters.page || currentPage,
      limit: frontendFilters.limit || ITEMS_PER_PAGE,
    };

    // Format date to ISO 8601 with time (DATE_TIME format for Instant)
    if (frontendFilters.dateFrom) {
      // Convert "YYYY-MM-DD" to "YYYY-MM-DDTHH:mm:ssZ" (start of day in UTC)
      const date = new Date(frontendFilters.dateFrom);
      date.setUTCHours(0, 0, 0, 0);
      params.dateFrom = date.toISOString();
    }
    if (frontendFilters.dateTo) {
      // Convert "YYYY-MM-DD" to "YYYY-MM-DDTHH:mm:ssZ" (end of day in UTC)
      const date = new Date(frontendFilters.dateTo);
      date.setUTCHours(23, 59, 59, 999);
      params.dateTo = date.toISOString();
    }

    // Map approved/rejected to decision
    if (frontendFilters.approved && frontendFilters.rejected) {
      // If both are selected, don't filter by decision (show all)
    } else if (frontendFilters.approved) {
      params.decision = "APPROVED";
    } else if (frontendFilters.rejected) {
      params.decision = "REJECTED";
    }

    // Map type name to docTypeId (only if options are loaded)
    if (frontendFilters.type && optionsLoaded) {
      const typeObj = documentTypes.find(t => t.name === frontendFilters.type);
      if (typeObj) {
        params.docTypeId = typeObj.id;
      } else {
        console.warn(`Document type not found: "${frontendFilters.type}". Available types:`, documentTypes.map(t => t.name));
      }
    }

    // Map domain name to domainId (only if options are loaded)
    if (frontendFilters.domain && optionsLoaded) {
      const domainObj = domains.find(d => d.name === frontendFilters.domain);
      if (domainObj) {
        params.domainId = domainObj.id;
      } else {
        console.warn(`Domain not found: "${frontendFilters.domain}". Available domains:`, domains.map(d => d.name));
      }
    }

    // Map search parameter
    if (frontendFilters.search) {
      params.search = frontendFilters.search;
    }

    return params;
  }, [currentPage, documentTypes, domains, optionsLoaded]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiParams = mapFiltersToApiParams(filters);
      const response = await getReviewedHistory(apiParams);
      setReviews(response.reviews);
      setTotal(response.total);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load review history");
    } finally {
      setLoading(false);
    }
  }, [filters, mapFiltersToApiParams]);

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

  const getBAApprovalIcon = useCallback((status?: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "PENDING":
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  }, []);

  const getBAApprovalLabel = useCallback((status?: string) => {
    switch (status) {
      case "APPROVED":
        return "BA Approved";
      case "REJECTED":
        return "BA Rejected";
      case "PENDING":
      default:
        return "Pending BA Approval";
    }
  }, []);

  const getBAApprovalClass = useCallback((status?: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600 dark:text-green-400";
      case "REJECTED":
        return "text-red-600 dark:text-red-400";
      case "PENDING":
      default:
        return "text-yellow-600 dark:text-yellow-400";
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
                    <th className={styles["table-header-cell"]} style={{ width: "16%" }}>Title</th>
                    <th className={styles["table-header-cell"]} style={{ width: "8%" }}>Type</th>
                    <th className={styles["table-header-cell"]} style={{ width: "8%" }}>Domain</th>
                    <th className={styles["table-header-cell"]} style={{ width: "10%" }}>Specialization</th>
                    <th className={styles["table-header-cell"]} style={{ width: "10%" }}>Tags</th>
                    <th className={styles["table-header-cell"]} style={{ width: "9%" }}>Uploader</th>
                    <th className={styles["table-header-cell"]} style={{ width: "10%" }}>Review Date</th>
                    <th className={styles["table-header-cell"]} style={{ width: "12%" }}>BA Approval</th>
                    <th className={styles["table-header-cell"]} style={{ width: "8%" }}>Action</th>
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
                        <span className={styles["table-cell-value"]}>
                          {formatDate(review.reviewDate)}
                        </span>
                      </td>
                      <td className={styles["table-cell"]}>
                        <div className="flex flex-col gap-1">
                          <div className={`flex items-center gap-1.5 ${getBAApprovalClass(review.baApprovalStatus)}`}>
                            {getBAApprovalIcon(review.baApprovalStatus)}
                            <span className="text-sm font-medium">
                              {getBAApprovalLabel(review.baApprovalStatus)}
                            </span>
                          </div>
                          {review.baApproval?.rejectionReason && (
                            <div className="text-xs text-red-500 dark:text-red-400 mt-0.5" title={review.baApproval.rejectionReason}>
                              Reason: {review.baApproval.rejectionReason.length > 30 
                                ? review.baApproval.rejectionReason.substring(0, 30) + "..." 
                                : review.baApproval.rejectionReason}
                            </div>
                          )}
                          {review.baApproval?.approvedAt && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(review.baApproval.approvedAt)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={styles["table-cell"]}>
                        <button
                          type="button"
                          onClick={() => setSelectedReview(review)}
                          className={styles["action-button-view"]}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
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

      {/* Review History Detail Modal */}
      {selectedReview && (
        <ReviewHistoryDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </div>
  );
}
