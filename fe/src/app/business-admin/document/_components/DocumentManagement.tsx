// src/app/business-admin/document/_components/DocumentManagement.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  DocumentListItem,
  DocumentListResponse,
  DocumentQueryParams,
} from "../api";
import {
  getDocuments,
  deleteDocument,
  activateDocument,
} from "../api";
import { DocumentFilters } from "./DocumentFilters";
import { Pagination } from "@/app/business-admin/users/_components/Pagination";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import { useToast, toast } from "@/components/ui/toast";
import { Eye, Power } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import styles from "../styles.module.css";

export function DocumentManagement() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activateModal, setActivateModal] = useState<{
    open: boolean;
    docId: string;
    docTitle: string;
  } | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const [filters, setFilters] = useState<DocumentQueryParams>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    deleted: false, // Exclude DELETED by default
  });

  // Fetch documents from API
  const fetchDocuments = useCallback(async (queryParams: DocumentQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const updatedFilters = { ...queryParams, limit: itemsPerPage };
      const response: DocumentListResponse = await getDocuments(updatedFilters);
      
      // Filter out DELETED documents if deleted is false and status is not explicitly selected
      let filteredDocuments = response.documents;
      let adjustedTotal = response.total;
      if (updatedFilters.deleted === false && !updatedFilters.status) {
        filteredDocuments = response.documents.filter(doc => doc.status !== "DELETED");
        // Adjust total count based on filtered results (approximate)
        const deletedCount = response.documents.length - filteredDocuments.length;
        adjustedTotal = Math.max(0, response.total - deletedCount);
      }
      
      setDocuments(filteredDocuments);
      setTotalItems(adjustedTotal);
      setCurrentPage(response.page);
      setFilters(updatedFilters);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : "Failed to fetch documents";
      setError(errorMessage);
      setDocuments([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Initial load - only once on mount
  useEffect(() => {
    fetchDocuments(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters: DocumentQueryParams) => {
    const updatedFilters = { ...newFilters, limit: itemsPerPage };
    fetchDocuments(updatedFilters);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    fetchDocuments(updatedFilters);
  };

  const handleDelete = async (docId: string | number) => {
    setLoading(true);
    setError(null);

    try {
      await deleteDocument(String(docId));
      showToast(toast.success("Document Deleted", "Document status changed to DELETED successfully"));
      await fetchDocuments(filters);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to delete document";
      showToast(toast.error("Delete Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!activateModal) return;

    setIsActivating(true);
    setError(null);

    try {
      await activateDocument(activateModal.docId);
      showToast(toast.success("Document Activated", "Document activated successfully"));
      setActivateModal(null);
      await fetchDocuments(filters);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to activate document";
      showToast(toast.error("Activate Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDetail = (docId: string) => {
    window.location.href = `/business-admin/document/${docId}`;
  };

  return (
    <div className={styles["container"]}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={styles["page-title"]}>Document Management</h1>
      </div>

      {/* Alerts */}
      {error && (
        <div className={styles["alert"] + " " + styles["alert-error"]}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <DocumentFilters
          onFiltersChange={handleFiltersChange}
          loading={loading}
        />
      </div>

      {/* Documents Table */}
      <div className={`${styles["table-container"]} mt-6`}>
        <div className="overflow-x-auto">
          <table className={styles["table"]}>
            <thead className={styles["table-header"]}>
              <tr>
                <th className={styles["table-header-cell"]}>Title</th>
                <th className={styles["table-header-cell"]}>Uploader</th>
                <th className={styles["table-header-cell"]}>Organization</th>
                <th className={styles["table-header-cell"]}>Type</th>
                <th className={styles["table-header-cell"]}>Status</th>
                <th className={styles["table-header-cell"]}>Public</th>
                <th className={styles["table-header-cell"]}>Premium</th>
                <th className={styles["table-header-cell"]}>Views</th>
                <th className={styles["table-header-cell"]}>Created At</th>
                <th className={styles["table-header-cell"]}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles["table-body"]}>
              {loading ? (
                <tr>
                  <td colSpan={10} className={styles["loading-container"]}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading documents...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles["empty-container"]}>
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className={styles["table-row"]}>
                    <td className={styles["table-cell"]}>
                      <div className={styles["table-cell-main"]}>
                        {doc.title || "N/A"}
                      </div>
                    </td>
                    <td className={styles["table-cell"]}>
                      {doc.uploader?.fullName || doc.uploader?.username || "N/A"}
                    </td>
                    <td className={styles["table-cell"]}>
                      {doc.organization?.name || "N/A"}
                    </td>
                    <td className={styles["table-cell"]}>
                      {doc.docTypeName || "N/A"}
                    </td>
                    <td className={styles["table-cell"]}>
                      <span
                        className={`${styles["status-badge"]} ${
                          doc.status === "ACTIVE"
                            ? styles["status-active"]
                            : doc.status === "REJECTED" || doc.status === "DELETED"
                            ? styles["status-inactive"]
                            : doc.status === "REVIEWING" || doc.status === "AI_VERIFYING"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : doc.status === "PENDING_REVIEW"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : doc.status === "PENDING_APPROVE"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : doc.status === "AI_REJECTED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : doc.status === "INACTIVE"
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {doc.status 
                          ? doc.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                          : "N/A"}
                      </span>
                    </td>
                    <td className={styles["table-cell"]}>
                      <span
                        className={`${styles["status-badge"]} ${
                          doc.visibility === "PUBLIC"
                            ? styles["status-active"]
                            : styles["status-inactive"]
                        }`}
                      >
                        {doc.visibility === "PUBLIC" ? "Public" : "Private"}
                      </span>
                    </td>
                    <td className={styles["table-cell"]}>
                      <span
                        className={`${styles["status-badge"]} ${
                          doc.isPremium
                            ? styles["status-active"]
                            : styles["status-inactive"]
                        }`}
                      >
                        {doc.isPremium ? "Premium" : "Free"}
                      </span>
                    </td>
                    <td className={styles["table-cell"]}>
                      {doc.viewCount ?? 0}
                    </td>
                    <td className={styles["table-cell"]}>
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className={styles["table-cell"]}>
                      <div className={styles["action-cell"]}>
                        <button
                          onClick={() => handleDetail(doc.id)}
                          className={styles["action-icon-btn"]}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {doc.status === "DELETED" ? (
                          <button
                            onClick={() => setActivateModal({
                              open: true,
                              docId: doc.id,
                              docTitle: doc.title || "Document",
                            })}
                            disabled={loading || isActivating}
                            className="h-9 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-green-300 bg-white text-green-600 hover:text-green-700 hover:border-green-400 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-green-300 disabled:hover:bg-white shadow-sm hover:shadow-md dark:border-green-700 dark:bg-gray-800 dark:text-green-400 dark:hover:text-green-300 dark:hover:border-green-600 dark:hover:bg-green-900/20 dark:disabled:hover:border-green-700 dark:disabled:hover:bg-gray-800"
                            title="Activate Document"
                          >
                            <Power className="w-4 h-4" />
                            <span>Activate</span>
                          </button>
                        ) : (
                          <DeleteConfirmation
                            onDelete={handleDelete}
                            itemId={doc.id}
                            itemName={doc.title || "Document"}
                            title="Delete Document"
                            description={`Are you sure you want to delete "${doc.title || "this document"}"?`}
                            size="sm"
                            variant="text"
                            className={styles["delete-btn-wrapper"]}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / itemsPerPage)}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>

      {/* Activate Confirmation Modal */}
      {activateModal && (
        <ConfirmModal
          open={activateModal.open}
          title="Activate Document"
          content={`Are you sure you want to activate "${activateModal.docTitle}"?`}
          subContent="This will change the document status to ACTIVE and make it available to users."
          confirmLabel="Activate"
          cancelLabel="Cancel"
          loading={isActivating}
          onConfirm={handleActivate}
          onCancel={() => setActivateModal(null)}
        />
      )}
    </div>
  );
}

