"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { fetchUploadHistory, requestReReview, type DocumentHistory, type UploadHistoryQueryParams } from "./api";
import { Pagination } from "@/components/ui/pagination";
import { UploadHistoryFilters } from "./_components/UploadHistoryFilters";
import ReReviewModal from "./_components/ReReviewModal";
import { useToast } from "@/components/ui/toast";
import styles from "./styles.module.css";
import { AlertCircle, FileText } from "lucide-react";

type LoadState = "loading" | "success" | "empty" | "error";

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
  const [reReviewingId, setReReviewingId] = useState<string | null>(null);
  const [isReReviewModalOpen, setIsReReviewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentHistory | null>(null);
  const isLoading = state === "loading";

  const fetchData = async (params: UploadHistoryQueryParams) => {
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
      const msg = e instanceof Error ? e.message : "Unable to load upload history. Please try again later.";
      setError(msg);
      setState("error");
      showToast({
        type: "error",
        title: "Error",
        message: msg,
        duration: 5000,
      });
    }
  };

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  const handleFiltersChange = (newFilters: UploadHistoryQueryParams) => {
    setFilters({
      ...newFilters,
      page: 1, // Reset to first page when filters change
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

  const handleReReviewClick = (document: DocumentHistory) => {
    setSelectedDocument(document);
    setIsReReviewModalOpen(true);
  };

  const handleReReviewSubmit = async (reason: string) => {
    if (!selectedDocument) return;

    try {
      setReReviewingId(selectedDocument.id);
      const result = await requestReReview(selectedDocument.id, reason);
      
      // Show success toast
      showToast({
        type: "success",
        title: "Re-review Requested",
        message: result.message || "Your request has been submitted and is under review.",
        duration: 5000,
      });
      
      // Refresh data to update status to PENDING
      await fetchData(filters);
      
      // Close modal after data is refreshed
      setIsReReviewModalOpen(false);
      setSelectedDocument(null);
    } catch (e: unknown) {
      // Error message will be shown in modal
      throw e;
    } finally {
      setReReviewingId(null);
    }
  };

  const handleReReviewModalClose = () => {
    if (reReviewingId) return; // Prevent closing while submitting
    setIsReReviewModalOpen(false);
    setSelectedDocument(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
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
      case "APPROVED":
        return styles["status-approved"];
      case "PENDING":
        return styles["status-pending"];
      case "REJECTED":
        return styles["status-rejected"];
      default:
        return "";
    }
  };

  // Get unique types and domains for filters
  const documentTypes = useMemo(() => {
    const types = new Set<string>();
    documents.forEach((doc) => types.add(doc.type));
    return Array.from(types);
  }, [documents]);

  const domains = useMemo(() => {
    const domainSet = new Set<string>();
    documents.forEach((doc) => domainSet.add(doc.domain));
    return Array.from(domainSet);
  }, [documents]);

  return (
    <main className={styles["page-container"]}>
      <Breadcrumb pageName="Upload History" />

      {/* Filters */}
      <div className={styles["filters-section"]}>
        <UploadHistoryFilters
          onFiltersChange={handleFiltersChange}
          loading={isLoading}
          documentTypes={documentTypes}
          domains={domains}
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
                <TableHead className="xl:pl-7.5">Document Name</TableHead>
                <TableHead>Upload Date/Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>File Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right xl:pr-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="border-b border-stroke last:border-b-0 dark:border-stroke-dark">
                  <TableCell className="xl:pl-7.5">
                    <div className={styles["document-name"]}>
                      <FileText className={styles["document-icon"]} />
                      <span className={styles["document-name-text"]}>{doc.documentName}</span>
                    </div>
                  </TableCell>
                  <TableCell className={styles["table-text"]}>
                    {formatDate(doc.uploadDate)}
                  </TableCell>
                  <TableCell className={styles["table-text"]}>{doc.type}</TableCell>
                  <TableCell className={styles["table-text"]}>{doc.domain}</TableCell>
                  <TableCell className={styles["table-text"]}>{doc.specialization}</TableCell>
                  <TableCell className={styles["table-text"]}>
                    {formatFileSize(doc.fileSize)}
                  </TableCell>
                  <TableCell>
                    <span className={`${styles["status-badge"]} ${getStatusBadgeClass(doc.status)}`}>
                      {doc.status}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right xl:pr-7.5 ${styles["actions-cell"]}`}>
                    {doc.status === "REJECTED" && doc.canRequestReview && (
                      <button
                        onClick={() => handleReReviewClick(doc)}
                        disabled={reReviewingId === doc.id || isReReviewModalOpen}
                        className={styles["btn-request-review"]}
                      >
                        Request Re-review
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination - Component có sẵn từ @/components/ui/pagination */}
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

      {/* Re-review Modal */}
      {selectedDocument && (
        <ReReviewModal
          isOpen={isReReviewModalOpen}
          onClose={handleReReviewModalClose}
          onSubmit={handleReReviewSubmit}
          documentName={selectedDocument.documentName}
        />
      )}
    </main>
  );
}

