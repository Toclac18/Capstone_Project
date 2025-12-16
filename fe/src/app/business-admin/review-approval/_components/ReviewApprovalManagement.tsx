"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Users,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { ReviewDetailModal } from "./ReviewDetailModal";
import {
  fetchReviewResults,
  approveReviewResult,
  type ReviewResult,
  type ReviewResultStatus,
} from "../api";
import styles from "../styles.module.css";

const ITEMS_PER_PAGE = 10;

export function ReviewApprovalManagement() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ReviewResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewResultStatus | "ALL">(
    "ALL",
  );
  const [selectedReview, setSelectedReview] = useState<ReviewResult | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadData = useCallback(
    async (page: number, status: ReviewResultStatus | "ALL") => {
      setLoading(true);
      try {
        const result = await fetchReviewResults({
          page: page - 1,
          size: ITEMS_PER_PAGE,
          status: status === "ALL" ? null : status,
        });
        setReviews(result.data);
        setTotalPages(result.pageInfo.totalPages);
        setTotalItems(result.pageInfo.totalElements);
        setCurrentPage(page);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Failed to load review results";
        showToast({ type: "error", title: "Error", message: msg });
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    loadData(1, statusFilter);
  }, [loadData, statusFilter]);

  const stats = useMemo(() => {
    const pending = reviews.filter((r) => r.status === "PENDING").length;
    const approved = reviews.filter((r) => r.status === "APPROVED").length;
    const rejected = reviews.filter((r) => r.status === "REJECTED").length;
    return { pending, approved, rejected, total: reviews.length };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (!searchTerm) return reviews;
    const search = searchTerm.toLowerCase();
    return reviews.filter((review) => {
      const matchesTitle = review.document.title.toLowerCase().includes(search);
      const matchesReviewer = review.reviewer.fullName
        .toLowerCase()
        .includes(search);
      const matchesUploader = review.uploader?.fullName
        ?.toLowerCase()
        .includes(search);
      return matchesTitle || matchesReviewer || matchesUploader;
    });
  }, [reviews, searchTerm]);

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setStatusFilter("ALL");
    setCurrentPage(1);
    loadData(1, "ALL");
  };

  const handleStatusFilterChange = (status: ReviewResultStatus | "ALL") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    loadData(page, statusFilter);
  };

  const handleViewDetail = (review: ReviewResult) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const handleApprove = async (reason: string) => {
    if (!selectedReview) return;
    try {
      await approveReviewResult(selectedReview.id, {
        approved: true,
        rejectionReason: reason || undefined,
      });
      showToast({
        type: "success",
        title: "Success",
        message: "Review result approved successfully",
      });
      setShowDetailModal(false);
      setSelectedReview(null);
      loadData(currentPage, statusFilter);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to approve review result";
      showToast({ type: "error", title: "Error", message: msg });
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedReview) return;
    try {
      await approveReviewResult(selectedReview.id, {
        approved: false,
        rejectionReason: reason,
      });
      showToast({
        type: "success",
        title: "Success",
        message: "Review result rejected. Reviewer must re-review.",
      });
      setShowDetailModal(false);
      setSelectedReview(null);
      loadData(currentPage, statusFilter);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to reject review result";
      showToast({ type: "error", title: "Error", message: msg });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={styles.container}>
      {/* Stats Cards */}
      <div className={styles["stats-grid"]}>
        <div className={`${styles["stat-card"]} ${styles["stat-pending"]}`}>
          <div className={styles["stat-icon-box"]}>
            <Clock className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.pending}</span>
            <span className={styles["stat-label"]}>Pending</span>
          </div>
        </div>
        <div className={`${styles["stat-card"]} ${styles["stat-approved"]}`}>
          <div className={styles["stat-icon-box"]}>
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.approved}</span>
            <span className={styles["stat-label"]}>Approved</span>
          </div>
        </div>
        <div className={`${styles["stat-card"]} ${styles["stat-rejected"]}`}>
          <div className={styles["stat-icon-box"]}>
            <XCircle className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.rejected}</span>
            <span className={styles["stat-label"]}>Rejected</span>
          </div>
        </div>
        <div className={`${styles["stat-card"]} ${styles["stat-total"]}`}>
          <div className={styles["stat-icon-box"]}>
            <Users className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.total}</span>
            <span className={styles["stat-label"]}>Total</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles["filters-card"]}>
        <div className={styles["filters-row"]}>
          <div className={styles["search-box"]}>
            <Search className={styles["search-icon"]} />
            <input
              type="text"
              placeholder="Search document, reviewer, uploader..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles["search-input"]}
            />
            <button onClick={handleSearch} className={styles["search-btn"]}>
              Search
            </button>
          </div>
          <div className={styles["filter-select-box"]}>
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                handleStatusFilterChange(
                  e.target.value as ReviewResultStatus | "ALL",
                )
              }
              className={styles["filter-select"]}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <button onClick={handleClearFilters} className={styles["clear-btn"]}>
            <RefreshCw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles["table-card"]}>
        {loading ? (
          <div className={styles["loading-box"]}>
            <div className={styles["spinner"]} />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className={styles["empty-box"]}>
            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-gray-500">No reviews found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={styles.table}>
                <thead>
                  <tr className={styles["table-head-row"]}>
                    <th className={styles["th"]}>Document</th>
                    <th className={styles["th"]}>Reviewer</th>
                    <th className={styles["th"]}>Decision</th>
                    <th className={styles["th"]}>Status</th>
                    <th className={styles["th"]}>Submitted</th>
                    <th className={styles["th"]}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((review) => (
                    <tr key={review.id} className={styles["table-row"]}>
                      <td className={styles["td"]}>
                        <div className={styles["doc-info"]}>
                          <div className={styles["doc-icon-box"]}>
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className={styles["doc-title"]}>
                              {review.document.title}
                            </p>
                            <p className={styles["doc-meta"]}>
                              {review.document.docType.name} •{" "}
                              {review.document.domain.name}
                            </p>
                            <p className={styles["doc-uploader"]}>
                              by {review.uploader?.fullName || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={styles["td"]}>
                        <div className={styles["reviewer-info"]}>
                          <div className={styles["avatar"]}>
                            {getInitials(review.reviewer.fullName)}
                          </div>
                          <div>
                            <p className={styles["reviewer-name"]}>
                              {review.reviewer.fullName}
                            </p>
                            <p className={styles["reviewer-email"]}>
                              {review.reviewer.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={styles["td"]}>
                        <span
                          className={`${styles["badge"]} ${review.decision === "APPROVED" ? styles["badge-approve"] : styles["badge-reject"]}`}
                        >
                          {review.decision === "APPROVED" ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {review.decision === "APPROVED"
                            ? "Approve"
                            : "Reject"}
                        </span>
                      </td>
                      <td className={styles["td"]}>
                        <span
                          className={`${styles["status"]} ${styles[`status-${review.status.toLowerCase()}`]}`}
                        >
                          {review.status}
                        </span>
                      </td>
                      <td className={styles["td"]}>
                        <span className={styles["date-text"]}>
                          {formatDate(review.submittedAt)}
                        </span>
                      </td>
                      <td className={styles["td"]}>
                        <button
                          onClick={() => handleViewDetail(review)}
                          className={styles["action-view"]}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className={styles["pagination-box"]}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handlePageChange}
                  loading={loading}
                />
              </div>
            )}
          </>
        )}
      </div>

      {selectedReview && showDetailModal && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setShowDetailModal(false)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
