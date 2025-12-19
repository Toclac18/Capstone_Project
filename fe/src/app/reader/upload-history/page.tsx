"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallback, useEffect, useState, useMemo } from "react";
import { fetchUploadHistory, type DocumentHistory, type UploadHistoryQueryParams } from "./api";
import { Pagination } from "@/components/ui/pagination";
import { UploadHistoryFilters } from "./_components/UploadHistoryFilters";
import { useToast } from "@/components/ui/toast";
import { getDocumentViolations, type DocumentViolation } from "@/services/document-violations.service";
import { getDocumentReviewResult, type ReviewResultResponse } from "@/services/document-review-result.service";
import { ViolationsModal } from "./_components/ViolationsModal";
import { ReviewResultModal } from "./_components/ReviewResultModal";
import styles from "./styles.module.css";
import { AlertCircle, FileText, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";

type LoadState = "loading" | "success" | "empty" | "error";
type SortColumn = "documentName" | "uploadDate";
type SortOrder = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export default function UploadHistoryPage() {
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [documents, setDocuments] = useState<DocumentHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [filters, setFilters] = useState<UploadHistoryQueryParams>({
    page: 1,
    limit: ITEMS_PER_PAGE,
  });
  const [sortBy, setSortBy] = useState<SortColumn | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>(undefined);
  const isLoading = state === "loading";

  // Violations modal state
  const [showViolationsModal, setShowViolationsModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentHistory | null>(null);
  const [violations, setViolations] = useState<DocumentViolation[]>([]);
  const [loadingViolations, setLoadingViolations] = useState(false);

  // Review result modal state
  const [showReviewResultModal, setShowReviewResultModal] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResultResponse | null>(null);
  const [loadingReviewResult, setLoadingReviewResult] = useState(false);

  const fetchData = useCallback(
    async (params: UploadHistoryQueryParams) => {
      setState("loading");
      setError(null);
      try {
        const result = await fetchUploadHistory({
          ...params,
          page: params.page || 1,
          limit: params.limit || ITEMS_PER_PAGE,
        });
        setDocuments(result.documents);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setCurrentPage(result.page);
        setState(result.documents.length ? "success" : "empty");
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Unable to load upload history. Please try again later.";
        setError(msg);
        setState("error");
        showToast({
          type: "error",
          title: "Error",
          message: msg,
          duration: 5000,
        });
      }
    },
    [showToast]
  );

  useEffect(() => {
    const loadData = async () => {
      await fetchData(filters);
    };
    loadData();
  }, [filters, fetchData]);

  const handleFiltersChange = (newFilters: UploadHistoryQueryParams) => {
    setFilters({
      ...newFilters,
      page: 1,
      limit: ITEMS_PER_PAGE,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "ACTIVE":
        return styles["status-approved"];
      case "AI_VERIFYING":
      case "REVIEWING":
      case "PENDING_REVIEW":
      case "PENDING_APPROVE":
        return styles["status-pending"];
      case "REJECTED":
      case "AI_REJECTED":
        return styles["status-rejected"];
      default:
        return "";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "AI_VERIFYING":
      case "REVIEWING":
      case "PENDING_REVIEW":
      case "PENDING_APPROVE":
        return "Pending";
      case "ACTIVE":
        return "Approved";
      case "AI_REJECTED":
      case "REJECTED":
        return "Rejected";
      default:
        return status;
    }
  };

  // Handle column sort - cycles through: undefined -> asc -> desc -> undefined
  const handleSort = useCallback((column: SortColumn) => {
    if (sortBy === column) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        // desc or undefined -> reset
        setSortBy(undefined);
        setSortOrder(undefined);
      }
    } else {
      // New column -> start with asc
      setSortBy(column);
      setSortOrder("asc");
    }
  }, [sortBy, sortOrder]);

  // Get sort icon for a column
  const getSortIcon = (column: SortColumn) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-primary" />
    );
  };

  // Sort documents in FE
  const sortedDocuments = useMemo(() => {
    if (!sortBy || !sortOrder) {
      return documents;
    }

    return [...documents].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortBy === "documentName") {
        aValue = a.documentName.toLowerCase();
        bValue = b.documentName.toLowerCase();
      } else {
        aValue = new Date(a.uploadDate).getTime();
        bValue = new Date(b.uploadDate).getTime();
      }

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [documents, sortBy, sortOrder]);

  // Handle view violations
  const handleViewViolations = async (doc: DocumentHistory) => {
    setSelectedDocument(doc);
    setShowViolationsModal(true);
    setLoadingViolations(true);
    setViolations([]);

    try {
      const data = await getDocumentViolations(doc.id);
      setViolations(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load violations";
      showToast({
        type: "error",
        title: "Error",
        message: msg,
        duration: 5000,
      });
    } finally {
      setLoadingViolations(false);
    }
  };

  // Check if document should show "View Reason" button (AI rejected)
  const shouldShowViewReason = (doc: DocumentHistory): boolean => {
    // Show for documents that are AI rejected (status = AI_REJECTED)
    return doc.status === "AI_REJECTED";
  };

  // Check if document should show "View Review" button (reviewer rejected - premium)
  const shouldShowViewReview = (doc: DocumentHistory): boolean => {
    // Show for premium documents that are rejected by reviewer (status = REJECTED, not AI_REJECTED)
    return doc.status === "REJECTED";
  };

  // Handle view review result
  const handleViewReviewResult = async (doc: DocumentHistory) => {
    setSelectedDocument(doc);
    setShowReviewResultModal(true);
    setLoadingReviewResult(true);
    setReviewResult(null);

    try {
      const data = await getDocumentReviewResult(doc.id);
      setReviewResult(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load review result";
      showToast({
        type: "error",
        title: "Error",
        message: msg,
        duration: 5000,
      });
    } finally {
      setLoadingReviewResult(false);
    }
  };


  return (
    <main className={styles["page-container"]}>
      <Breadcrumb pageName="Upload History" />

      <div className={styles["filters-section"]}>
        <UploadHistoryFilters
          onFiltersChange={handleFiltersChange}
          loading={isLoading}
        />
      </div>

      {isLoading && (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-skeleton"]} />
          <div className={styles["loading-skeleton-large"]} />
        </div>
      )}

      {state === "error" && (
        <div className={styles["error-container"]}>
          <AlertCircle className={styles["error-icon"]} />
          <p>{error || "Unable to load upload history. Please try again later."}</p>
        </div>
      )}

      {state === "empty" && (
        <div className={styles["empty-container"]}>
          <FileText className={styles["empty-icon"]} />
          <p className={styles["empty-text"]}>
            You haven&apos;t uploaded any documents yet.
          </p>
        </div>
      )}

      {state === "success" && (
        <div className={styles["table-container"]}>
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-3 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
                <TableHead 
                  className={`xl:pl-7.5 ${styles["sortable-header"]}`}
                  onClick={() => handleSort("documentName")}
                >
                  <div className="flex items-center cursor-pointer select-none">
                    Document Name
                    {getSortIcon("documentName")}
                  </div>
                </TableHead>
                <TableHead 
                  className={styles["sortable-header"]}
                  onClick={() => handleSort("uploadDate")}
                >
                  <div className="flex items-center cursor-pointer select-none">
                    Upload Date
                    {getSortIcon("uploadDate")}
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDocuments.map((doc) => (
                <TableRow key={doc.id} className="border-b border-stroke last:border-b-0 dark:border-stroke-dark">
                  <TableCell className="xl:pl-7.5">
                    <Link href={`/docs-view/${doc.id}`} className={styles["document-name"]}>
                      <FileText className={styles["document-icon"]} />
                      <span className={styles["document-name-text"]}>{doc.documentName}</span>
                    </Link>
                  </TableCell>
                  <TableCell className={styles["table-text"]}>
                    {formatDate(doc.uploadDate)}
                  </TableCell>
                  <TableCell className={styles["table-text"]}>{doc.type}</TableCell>
                  <TableCell className={styles["table-text"]}>{doc.domain}</TableCell>
                  <TableCell className={styles["table-text"]}>{doc.specialization}</TableCell>
                  <TableCell>
                    <span className={`${styles["visibility-badge"]} ${doc.isPremium ? styles["visibility-premium"] : styles["visibility-public"]}`}>
                      {doc.isPremium ? "Premium" : "Public"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`${styles["status-badge"]} ${getStatusBadgeClass(doc.status)}`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </TableCell>
                  <TableCell className={styles["actions-cell"]}>
                    <div className="flex gap-2">
                      {shouldShowViewReason(doc) && (
                        <button
                          onClick={() => handleViewViolations(doc)}
                          className={styles["btn-view-reason"]}
                          title="View AI rejection reasons"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          View Reason
                        </button>
                      )}
                      {shouldShowViewReview(doc) && (
                        <button
                          onClick={() => handleViewReviewResult(doc)}
                          className={styles["btn-view-reason"]}
                          title="View review result"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          View Reason
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              loading={isLoading}
            />
          )}
        </div>
      )}

      {/* Violations Modal */}
      <ViolationsModal
        isOpen={showViolationsModal}
        onClose={() => {
          setShowViolationsModal(false);
          setSelectedDocument(null);
          setViolations([]);
        }}
        documentName={selectedDocument?.documentName || ""}
        violations={violations}
        loading={loadingViolations}
      />

      {/* Review Result Modal */}
      <ReviewResultModal
        isOpen={showReviewResultModal}
        onClose={() => {
          setShowReviewResultModal(false);
          setSelectedDocument(null);
          setReviewResult(null);
        }}
        documentName={selectedDocument?.documentName || ""}
        reviewResult={reviewResult}
        loading={loadingReviewResult}
      />
    </main>
  );
}

