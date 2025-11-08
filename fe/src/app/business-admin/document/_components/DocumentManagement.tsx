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
} from "../api";
import { DocumentFilters } from "./DocumentFilters";
import { Pagination } from "@/app/business-admin/users/_components/Pagination";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import { useToast, toast } from "@/components/ui/toast";
import { Eye } from "lucide-react";
import styles from "../styles.module.css";

export function DocumentManagement() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [filters, setFilters] = useState<DocumentQueryParams>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch documents from API
  const fetchDocuments = useCallback(async (queryParams: DocumentQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const updatedFilters = { ...queryParams, limit: itemsPerPage };
      const response: DocumentListResponse = await getDocuments(updatedFilters);
      setDocuments(response.documents);
      setTotalItems(response.total);
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
      showToast(toast.success("Document Deleted", "Document deleted successfully"));
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
      <DocumentFilters
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      {/* Documents Table */}
      <div className={styles["table-container"]}>
        <div className="overflow-x-auto">
          <table className={styles["table"]}>
            <thead className={styles["table-header"]}>
              <tr>
                <th className={styles["table-header-cell"]}>Title</th>
                <th className={styles["table-header-cell"]}>Uploader</th>
                <th className={styles["table-header-cell"]}>Organization</th>
                <th className={styles["table-header-cell"]}>Type</th>
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
                  <td colSpan={9} className={styles["loading-container"]}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading documents...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles["empty-container"]}>
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
                      {doc.type?.name || "N/A"}
                    </td>
                    <td className={styles["table-cell"]}>
                      <span
                        className={`${styles["status-badge"]} ${
                          doc.isPublic
                            ? styles["status-active"]
                            : styles["status-inactive"]
                        }`}
                      >
                        {doc.isPublic ? "Public" : "Private"}
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
    </div>
  );
}

