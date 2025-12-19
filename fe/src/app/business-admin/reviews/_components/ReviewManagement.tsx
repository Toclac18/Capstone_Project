"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Eye,
  UserPlus,
  UserCog,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  FileText,
  Users,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ClipboardCheck,
  ClipboardList,
} from "lucide-react";
import { getDocuments } from "../../document/api";
import type {
  DocumentListItem,
  DocumentQueryParams,
  DocumentListResponse,
} from "../../document/api";
import { getAllReviewRequests } from "@/services/review-request.service";
import type { ReviewRequestResponse } from "@/types/review-request";
import { AssignReviewerModal } from "../../document/_components/AssignReviewerModal";
import { ReviewDetailModal } from "./ReviewDetailModal";
import { DocumentDetailModal } from "./DocumentDetailModal";
import { Pagination } from "@/components/ui/pagination";
import {
  fetchReviewResults,
  approveReviewResult,
  type ReviewResult,
} from "../../review-approval/api";
import { ReviewDetailModal as ReviewResultDetailModal } from "../../review-approval/_components/ReviewDetailModal";
import styles from "../styles.module.css";

type TabType =
  | "needs-assignment"
  | "pending"
  | "in-review"
  | "result-pending"
  | "result-completed";

export function ReviewManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("needs-assignment");
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequestResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentListItem | null>(null);
  const [selectedReviewRequest, setSelectedReviewRequest] =
    useState<ReviewRequestResponse | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewDetailModal, setShowReviewDetailModal] = useState(false);
  const [selectedReviewRequestId, setSelectedReviewRequestId] = useState<
    string | null
  >(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    "desc",
  );

  // Review Results states
  const [reviewResults, setReviewResults] = useState<ReviewResult[]>([]);
  const [reviewResultsLoading, setReviewResultsLoading] = useState(false);
  const [selectedReviewResult, setSelectedReviewResult] =
    useState<ReviewResult | null>(null);
  const [showReviewResultModal, setShowReviewResultModal] = useState(false);

  // Document Detail Modal state
  const [showDocumentDetailModal, setShowDocumentDetailModal] = useState(false);
  const [selectedDocForDetail, setSelectedDocForDetail] =
    useState<DocumentListItem | null>(null);
  const [selectedReviewRequestForDetail, setSelectedReviewRequestForDetail] =
    useState<ReviewRequestResponse | null>(null);


  // Fetch review requests
  const fetchReviewRequests = useCallback(async () => {
    try {
      const response = await getAllReviewRequests(0, 10000);
      const allRequests = response.content || [];
      setReviewRequests(allRequests);
    } catch (e) {
      console.error("Failed to fetch review requests:", e);
      setReviewRequests([]);
    }
  }, []);

  // Fetch review results (for result-pending and result-completed tabs)
  const fetchAllReviewResults = useCallback(async () => {
    setReviewResultsLoading(true);
    try {
      const response = await fetchReviewResults({ page: 0, size: 1000 });
      setReviewResults(response.data || []);
    } catch (e) {
      console.error("Failed to fetch review results:", e);
      setReviewResults([]);
    } finally {
      setReviewResultsLoading(false);
    }
  }, []);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: DocumentQueryParams = {
        page: 1,
        limit: 100,
        isPremium: true,
        deleted: false,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (searchTerm) {
        filters.search = searchTerm;
      }

      const response: DocumentListResponse = await getDocuments(filters);
      setDocuments(response.documents);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to fetch documents";
      setError(errorMessage);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchReviewRequests();
    fetchAllReviewResults();
  }, [fetchReviewRequests, fetchAllReviewResults]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Get review request for a document
  const getReviewRequestForDocument = useCallback(
    (documentId: string): ReviewRequestResponse | null => {
      if (!reviewRequests || reviewRequests.length === 0) {
        return null;
      }

      const docIdStr = String(documentId);
      const allDocRequests = reviewRequests.filter((req) => {
        const reqDocId = String(req.document?.id || "");
        return reqDocId === docIdStr;
      });

      if (allDocRequests.length === 0) {
        return null;
      }

      const activeRequests = allDocRequests.filter(
        (req) => req.status === "PENDING" || req.status === "ACCEPTED",
      );

      if (activeRequests.length > 0) {
        return activeRequests.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
      }

      return allDocRequests.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
    },
    [reviewRequests],
  );

  // Calculate stats
  const stats = useMemo(() => {
    let needsAssignment = 0;
    let pending = 0;
    let inReview = 0;

    documents.forEach((doc) => {
      const docIdStr = String(doc.id);

      if (doc.status === "PENDING_REVIEW") {
        const req = getReviewRequestForDocument(doc.id);
        if (!req || (req.status !== "PENDING" && req.status !== "ACCEPTED")) {
          needsAssignment++;
        }
      }

      const pendingRequests = reviewRequests.filter((req) => {
        const reqDocId = String(req.document?.id || "");
        return reqDocId === docIdStr && req.status === "PENDING";
      });
      if (pendingRequests.length > 0) {
        pending++;
      }

      if (doc.status === "REVIEWING") {
        const req = getReviewRequestForDocument(doc.id);
        if (req && req.status === "ACCEPTED") {
          inReview++;
        }
      }

    });

    // Review Results stats
    const resultPending = reviewResults.filter(
      (r) => r.status === "PENDING",
    ).length;
    const resultCompleted = reviewResults.filter(
      (r) => r.status === "APPROVED" || r.status === "REJECTED",
    ).length;

    return {
      needsAssignment,
      pending,
      inReview,
      resultPending,
      resultCompleted,
    };
  }, [documents, reviewRequests, getReviewRequestForDocument, reviewResults]);


  // Filter and sort documents based on active tab
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = [...documents];

    // Filter by tab
    if (activeTab === "needs-assignment") {
      filtered = filtered.filter((doc) => {
        if (doc.status !== "PENDING_REVIEW") return false;
        const req = getReviewRequestForDocument(doc.id);
        return !req || (req.status !== "PENDING" && req.status !== "ACCEPTED");
      });
    } else if (activeTab === "pending") {
      filtered = filtered.filter((doc) => {
        const docIdStr = String(doc.id);
        const pendingRequests = reviewRequests.filter((req) => {
          const reqDocId = String(req.document?.id || "");
          return reqDocId === docIdStr && req.status === "PENDING";
        });
        return pendingRequests.length > 0;
      });
    } else if (activeTab === "in-review") {
      filtered = filtered.filter((doc) => {
        if (doc.status !== "REVIEWING") return false;
        const req = getReviewRequestForDocument(doc.id);
        return req && req.status === "ACCEPTED";
      });
    }
    // "all" tab shows all documents

    // Sort by date
    if (sortOrder) {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    }

    return filtered;
  }, [
    documents,
    activeTab,
    getReviewRequestForDocument,
    reviewRequests,
    sortOrder,
  ]);

  // Paginate
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedDocuments.slice(startIndex, endIndex);
  }, [filteredAndSortedDocuments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(
    filteredAndSortedDocuments.length / itemsPerPage,
  );

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const handleDateSort = () => {
    if (sortOrder === undefined) {
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortOrder("asc");
    } else {
      setSortOrder(undefined);
    }
  };

  const getDateSortIcon = () => {
    if (sortOrder === "asc") {
      return <ArrowUp className="w-4 h-4 ml-1 text-primary" />;
    } else if (sortOrder === "desc") {
      return <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
    }
    return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleAssignSuccess = () => {
    fetchReviewRequests();
    fetchDocuments();
    setShowAssignModal(false);
    setSelectedDocument(null);
    setSelectedReviewRequest(null);
  };

  const handleViewDetail = (
    doc: DocumentListItem,
    reviewRequest: ReviewRequestResponse | null,
  ) => {
    setSelectedDocForDetail(doc);
    setSelectedReviewRequestForDetail(reviewRequest);
    setShowDocumentDetailModal(true);
  };

  const handleAssignClick = (doc: DocumentListItem) => {
    setSelectedDocument(doc);
    setSelectedReviewRequest(null);
    setShowAssignModal(true);
  };

  const handleChangeReviewerClick = (
    doc: DocumentListItem,
    reviewRequest: ReviewRequestResponse,
  ) => {
    setSelectedDocument(doc);
    setSelectedReviewRequest(reviewRequest);
    setShowAssignModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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

  // Filter review results based on tab
  const filteredReviewResults = useMemo(() => {
    if (activeTab === "result-pending") {
      return reviewResults.filter((r) => r.status === "PENDING");
    } else if (activeTab === "result-completed") {
      return reviewResults.filter(
        (r) => r.status === "APPROVED" || r.status === "REJECTED",
      );
    }
    return [];
  }, [reviewResults, activeTab]);

  // Paginate review results
  const paginatedReviewResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReviewResults.slice(startIndex, endIndex);
  }, [filteredReviewResults, currentPage, itemsPerPage]);

  const reviewResultsTotalPages = Math.ceil(
    filteredReviewResults.length / itemsPerPage,
  );

  const handleViewReviewResult = (result: ReviewResult) => {
    setSelectedReviewResult(result);
    setShowReviewResultModal(true);
  };

  const handleReviewResultApprove = async (reason: string) => {
    if (!selectedReviewResult) return;
    try {
      await approveReviewResult(selectedReviewResult.id, {
        approved: true,
        rejectionReason: reason || undefined,
      });
      setShowReviewResultModal(false);
      setSelectedReviewResult(null);
      fetchAllReviewResults();
      fetchDocuments();
    } catch (e) {
      console.error("Failed to approve review result:", e);
      throw e;
    }
  };

  const handleReviewResultReject = async (reason: string) => {
    if (!selectedReviewResult) return;
    try {
      await approveReviewResult(selectedReviewResult.id, {
        approved: false,
        rejectionReason: reason,
      });;
      setShowReviewResultModal(false);
      setSelectedReviewResult(null);
      fetchAllReviewResults();
      fetchDocuments();
    } catch (e) {
      console.error("Failed to reject review result:", e);
      throw e;
    }
  };

  const tabs = [
    {
      id: "needs-assignment" as TabType,
      label: "Needs Assignment",
      count: stats.needsAssignment,
      icon: AlertCircle,
    },
    {
      id: "pending" as TabType,
      label: "Request Pending",
      count: stats.pending,
      icon: Clock,
    },
    {
      id: "in-review" as TabType,
      label: "In Review",
      count: stats.inReview,
      icon: Users,
    },
    {
      id: "result-pending" as TabType,
      label: "Result Pending",
      count: stats.resultPending,
      icon: ClipboardList,
    },
    {
      id: "result-completed" as TabType,
      label: "Result Completed",
      count: stats.resultCompleted,
      icon: ClipboardCheck,
    },
  ];


  return (
    <div className={styles.container}>
      {/* Stats Cards */}
      <div className={styles["stats-grid"]}>
        <div
          className={`${styles["stat-card"]} ${styles["stat-needs-assignment"]}`}
        >
          <div className={styles["stat-icon-box"]}>
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.needsAssignment}</span>
            <span className={styles["stat-label"]}>Needs Assignment</span>
          </div>
        </div>
        <div className={`${styles["stat-card"]} ${styles["stat-pending"]}`}>
          <div className={styles["stat-icon-box"]}>
            <Clock className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.pending}</span>
            <span className={styles["stat-label"]}>Request Pending</span>
          </div>
        </div>
        <div className={`${styles["stat-card"]} ${styles["stat-in-review"]}`}>
          <div className={styles["stat-icon-box"]}>
            <Users className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.inReview}</span>
            <span className={styles["stat-label"]}>In Review</span>
          </div>
        </div>
        <div
          className={`${styles["stat-card"]} ${styles["stat-result-pending"]}`}
        >
          <div className={styles["stat-icon-box"]}>
            <ClipboardList className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.resultPending}</span>
            <span className={styles["stat-label"]}>Result Pending</span>
          </div>
        </div>
        <div
          className={`${styles["stat-card"]} ${styles["stat-result-completed"]}`}
        >
          <div className={styles["stat-icon-box"]}>
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.resultCompleted}</span>
            <span className={styles["stat-label"]}>Result Completed</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles["tabs-card"]}>
        <div className={styles["tabs-row"]}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`${styles["tab-btn"]} ${activeTab === tab.id ? styles["tab-active"] : ""}`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <span className={styles["tab-count"]}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className={styles["filters-card"]}>
        <div className={styles["filters-row"]}>
          <div className={styles["search-box"]}>
            <Search className={styles["search-icon"]} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles["search-input"]}
            />
            <button onClick={handleSearch} className={styles["search-btn"]}>
              Search
            </button>
          </div>
          <button onClick={handleClearFilters} className={styles["clear-btn"]}>
            <RefreshCw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className={`${styles.alert} ${styles["alert-error"]}`}>{error}</div>
      )}

      {/* Table */}
      <div className={styles["table-card"]}>
        {/* Review Results Table (for result-pending and result-completed tabs) */}
        {(activeTab === "result-pending" || activeTab === "result-completed") ? (
          reviewResultsLoading ? (
            <div className={styles["loading-box"]}>
              <div className={styles["spinner"]} />
            </div>
          ) : paginatedReviewResults.length === 0 ? (
            <div className={styles["empty-box"]}>
              <ClipboardList className="h-16 w-16 text-gray-300 dark:text-gray-600" />
              <p className="mt-4 text-gray-500">No review results found</p>
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
                      <th className={styles["th"]}>Result Status</th>
                      <th className={styles["th"]}>Submitted</th>
                      <th className={styles["th"]}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReviewResults.map((result) => (
                      <tr key={result.id} className={styles["table-row"]}>
                        <td className={styles["td"]}>
                          <div className={styles["doc-info"]}>
                            <div className={styles["doc-icon-box"]}>
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className={styles["doc-title"]}>
                                {result.document.title}
                              </p>
                              <p className={styles["doc-meta"]}>
                                {result.document.docType.name} •{" "}
                                {result.document.domain.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={styles["td"]}>
                          <div className={styles["reviewer-info"]}>
                            <div className={styles["avatar"]}>
                              {getInitials(result.reviewer.fullName)}
                            </div>
                            <div>
                              <p className={styles["reviewer-name"]}>
                                {result.reviewer.fullName}
                              </p>
                              <p className={styles["reviewer-email"]}>
                                {result.reviewer.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={styles["td"]}>
                          <span
                            className={`${styles["badge"]} ${
                              result.decision === "APPROVED"
                                ? styles["badge-active"]
                                : styles["badge-rejected"]
                            }`}
                          >
                            {result.decision === "APPROVED" ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {result.decision}
                          </span>
                        </td>
                        <td className={styles["td"]}>
                          <span
                            className={`${styles["status"]} ${
                              result.status === "PENDING"
                                ? styles["status-pending"]
                                : result.status === "APPROVED"
                                  ? styles["status-accepted"]
                                  : styles["status-rejected"]
                            }`}
                          >
                            {result.status}
                          </span>
                        </td>
                        <td className={styles["td"]}>
                          <span className={styles["date-text"]}>
                            {formatDate(result.submittedAt)}
                          </span>
                        </td>
                        <td className={styles["td"]}>
                          <div className={styles["actions"]}>
                            <button
                              onClick={() => handleViewReviewResult(result)}
                              className={styles["action-view"]}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reviewResultsTotalPages > 1 && (
                <div className={styles["pagination-box"]}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={reviewResultsTotalPages}
                    totalItems={filteredReviewResults.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    loading={reviewResultsLoading}
                  />
                </div>
              )}
            </>
          )
        ) : loading ? (
          <div className={styles["loading-box"]}>
            <div className={styles["spinner"]} />
          </div>
        ) : paginatedDocuments.length === 0 ? (
          <div className={styles["empty-box"]}>
            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-gray-500">No documents found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={styles.table}>
                <thead>
                  <tr className={styles["table-head-row"]}>
                    <th className={styles["th"]}>Document</th>
                    <th className={styles["th"]}>Reviewer</th>
                    <th className={styles["th"]}>Document Status</th>
                    <th className={styles["th"]}>Review Status</th>
                    <th className={styles["th"]}>Deadline</th>
                    <th
                      className={`${styles["th"]} ${styles["th-sortable"]}`}
                      onClick={handleDateSort}
                    >
                      <span className="flex items-center cursor-pointer">
                        Created
                        {getDateSortIcon()}
                      </span>
                    </th>
                    <th className={styles["th"]}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDocuments.map((doc) => {
                    const docIdStr = String(doc.id);
                    let reviewRequest: ReviewRequestResponse | null = null;

                    if (activeTab === "pending") {
                      const pendingRequests = reviewRequests.filter((req) => {
                        const reqDocId = String(req.document?.id || "");
                        return reqDocId === docIdStr && req.status === "PENDING";
                      });
                      if (pendingRequests.length > 0) {
                        reviewRequest = pendingRequests.sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                        )[0];
                      }
                    } else {
                      reviewRequest = getReviewRequestForDocument(doc.id);
                    }

                    const deadline =
                      reviewRequest?.status === "PENDING"
                        ? reviewRequest.responseDeadline
                        : reviewRequest?.status === "ACCEPTED"
                          ? reviewRequest.reviewDeadline
                          : null;
                    const isOverdue = deadline
                      ? new Date(deadline) < new Date()
                      : false;

                    return (
                      <tr key={doc.id} className={styles["table-row"]}>
                        <td className={styles["td"]}>
                          <div className={styles["doc-info"]}>
                            <div className={styles["doc-icon-box"]}>
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className={styles["doc-title"]}>
                                {doc.title || "N/A"}
                              </p>
                              {doc.specializationName && (
                                <p className={styles["doc-meta"]}>
                                  {doc.specializationName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={styles["td"]}>
                          {reviewRequest?.reviewer ? (
                            <div className={styles["reviewer-info"]}>
                              <div className={styles["avatar"]}>
                                {getInitials(reviewRequest.reviewer.fullName)}
                              </div>
                              <div>
                                <p className={styles["reviewer-name"]}>
                                  {reviewRequest.reviewer.fullName}
                                </p>
                                <p className={styles["reviewer-email"]}>
                                  {reviewRequest.reviewer.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className={styles["td"]}>
                          <span
                            className={`${styles["badge"]} ${
                              doc.status === "PENDING_REVIEW"
                                ? styles["badge-pending-review"]
                                : doc.status === "REVIEWING"
                                  ? styles["badge-reviewing"]
                                  : doc.status === "ACTIVE"
                                    ? styles["badge-active"]
                                    : doc.status === "REJECTED"
                                      ? styles["badge-rejected"]
                                      : ""
                            }`}
                          >
                            {doc.status?.replace(/_/g, " ") || "N/A"}
                          </span>
                        </td>
                        <td className={styles["td"]}>
                          {reviewRequest ? (
                            <span
                              className={`${styles["status"]} ${styles[`status-${reviewRequest.status.toLowerCase()}`]}`}
                            >
                              {reviewRequest.status === "PENDING" && (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              {reviewRequest.status === "ACCEPTED" && (
                                <Users className="w-3.5 h-3.5" />
                              )}
                              {reviewRequest.status === "REJECTED" && (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              {reviewRequest.status === "EXPIRED" && (
                                <AlertCircle className="w-3.5 h-3.5" />
                              )}
                              {reviewRequest.status}
                            </span>
                          ) : doc.status === "PENDING_REVIEW" ? (
                            <span
                              className={`flex items-center gap-1 ${styles["status-no-request"]}`}
                            >
                              <AlertCircle className="w-4 h-4" />
                              No Request
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className={styles["td"]}>
                          {deadline ? (
                            <div>
                              <span className={styles["date-text"]}>
                                {formatDate(deadline)}
                              </span>
                              {isOverdue && (
                                <span className={styles["overdue-text"]}>
                                  (Overdue)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className={styles["td"]}>
                          <span className={styles["date-text"]}>
                            {formatDate(doc.createdAt)}
                          </span>
                        </td>
                        <td className={styles["td"]}>
                          <div className={styles["actions"]}>
                            <button
                              onClick={() =>
                                handleViewDetail(doc, reviewRequest)
                              }
                              className={styles["action-view"]}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {doc.status === "PENDING_REVIEW" &&
                              !reviewRequest && (
                                <button
                                  onClick={() => handleAssignClick(doc)}
                                  className={styles["action-assign"]}
                                  title="Assign Reviewer"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </button>
                              )}
                            {reviewRequest &&
                              reviewRequest.status === "PENDING" && (
                                <button
                                  onClick={() =>
                                    handleChangeReviewerClick(doc, reviewRequest)
                                  }
                                  className={styles["action-change"]}
                                  title="Change Reviewer"
                                >
                                  <UserCog className="h-4 w-4" />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className={styles["pagination-box"]}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredAndSortedDocuments.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  loading={loading}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Assign Reviewer Modal */}
      {showAssignModal && selectedDocument && (
        <AssignReviewerModal
          open={showAssignModal}
          documentId={selectedDocument.id}
          documentTitle={selectedDocument.title || "Document"}
          documentDomain={undefined}
          documentSpecialization={selectedDocument.specializationName}
          existingReviewRequestId={selectedReviewRequest?.id || undefined}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDocument(null);
            setSelectedReviewRequest(null);
          }}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Review Detail Modal */}
      {showReviewDetailModal && selectedReviewRequestId && (
        <ReviewDetailModal
          isOpen={showReviewDetailModal}
          onClose={() => {
            setShowReviewDetailModal(false);
            setSelectedReviewRequestId(null);
          }}
          reviewRequestId={selectedReviewRequestId}
        />
      )}

      {/* Review Result Detail Modal */}
      {showReviewResultModal && selectedReviewResult && (
        <ReviewResultDetailModal
          review={selectedReviewResult}
          onClose={() => {
            setShowReviewResultModal(false);
            setSelectedReviewResult(null);
          }}
          onApprove={handleReviewResultApprove}
          onReject={handleReviewResultReject}
        />
      )}

      {/* Document Detail Modal */}
      {showDocumentDetailModal && selectedDocForDetail && (
        <DocumentDetailModal
          document={selectedDocForDetail}
          reviewRequest={selectedReviewRequestForDetail}
          onClose={() => {
            setShowDocumentDetailModal(false);
            setSelectedDocForDetail(null);
            setSelectedReviewRequestForDetail(null);
          }}
        />
      )}
    </div>
  );
}
