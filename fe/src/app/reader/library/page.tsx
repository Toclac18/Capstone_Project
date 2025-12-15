"use client";

import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchLibrary,
  updateLibraryDocument,
  deleteLibraryDocument,
  type LibraryDocument,
  type LibraryQueryParams,
} from "./api";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { LibraryFilters } from "./_components/LibraryFilters";
import EditDocumentModal, {
  type UpdateDocumentData,
} from "./_components/EditDocumentModal";
import DeleteDocumentModal from "./_components/DeleteDocumentModal";
import {
  getDocumentTypes,
  getDomains,
} from "@/services/upload-documents.service";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import styles from "./styles.module.css";
import {
  AlertCircle,
  FileText,
  Edit,
  Trash2,
  Eye,
  Calendar,
  FileType,
  FolderOpen,
  HardDrive,
} from "lucide-react";

type LoadState = "loading" | "success" | "empty" | "error";

const ITEMS_PER_PAGE = 10;
const THUMBNAIL_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/thumb/";
const DEFAULT_THUMBNAIL = "/images/document.jpg";

export default function LibraryPage() {
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>("loading");
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [filters, setFilters] = useState<LibraryQueryParams>({
    page: 1,
    limit: ITEMS_PER_PAGE,
  });
  const [allDocumentTypes, setAllDocumentTypes] = useState<{ id: string; name: string }[]>([]);
  const [allDomains, setAllDomains] = useState<{ id: string; name: string }[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<LibraryDocument | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchData = useCallback(
    async (params: LibraryQueryParams) => {
      setState("loading");
      setError(null);
      try {
        const result = await fetchLibrary({
          ...params,
          page: params.page || 1,
          limit: params.limit || ITEMS_PER_PAGE,
        });
        setDocuments(result.documents);
        setTotal(result.total);
        const limit = result.limit || params.limit || ITEMS_PER_PAGE;
        setTotalPages(result.total > 0 ? Math.ceil(result.total / limit) : 1);
        setCurrentPage(result.page || params.page || 1);
        setState(result.documents.length ? "success" : "empty");
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : "Unable to load your library. Please try again later.";
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
    [showToast],
  );

  useEffect(() => {
    const loadData = async () => {
      await fetchData(filters);
    };
    loadData();
  }, [filters, fetchData]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [types, domainsData] = await Promise.all([
          getDocumentTypes(),
          getDomains(),
        ]);
        setAllDocumentTypes(types.map((t) => ({ id: t.id, name: t.name })));
        setAllDomains(domainsData.map((d) => ({ id: d.id, name: d.name })));
      } catch {
        // Cannot load filter options
        setAllDocumentTypes([]);
        setAllDomains([]);
      }
    };
    loadFilterOptions();
  }, []);

  const handleFiltersChange = (newFilters: LibraryQueryParams) => {
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

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  const handleEdit = useCallback((document: LibraryDocument) => {
    setSelectedDocument(document);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback((document: LibraryDocument) => {
    setSelectedDocument(document);
    setShowDeleteModal(true);
  }, []);

  const handleEditSave = async (data: UpdateDocumentData) => {
    if (!selectedDocument) return;
    try {
      await updateLibraryDocument(selectedDocument.id, data);
      // Refresh data after update - ensure it completes before closing modal
      await fetchData(filters);
      setShowEditModal(false);
      setSelectedDocument(null);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Unable to update document. Please try again later.";
      showToast({
        type: "error",
        title: "Error",
        message: msg,
        duration: 5000,
      });
      throw e; // Re-throw to let modal handle error display
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;
    const documentId = selectedDocument.id;
    try {
      await deleteLibraryDocument(documentId);

      // Refresh data first - ensure it completes
      await fetchData(filters);

      // Then close modal and show success
      setShowDeleteModal(false);
      setSelectedDocument(null);

      showToast({
        type: "success",
        title: "Success",
        message: "Document deleted successfully.",
        duration: 3000,
      });
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : "Unable to delete document. Please try again later.";
      showToast({
        type: "error",
        title: "Error",
        message: msg,
        duration: 5000,
      });
      throw e; // Re-throw to let modal handle error display
    }
  };

  const isLoading = state === "loading";

  return (
    <main className={styles["page-container"]}>
      <Breadcrumb pageName="Library" />

      {/* Filters */}
      <div className={styles["filters-section"]}>
        <LibraryFilters
          onFiltersChange={handleFiltersChange}
          loading={isLoading}
          documentTypes={allDocumentTypes}
          domains={allDomains}
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
          <p>
            {error || "Unable to load your library. Please try again later."}
          </p>
        </div>
      )}

      {state === "empty" && (
        <div className={styles["empty-container"]}>
          <FileText className={styles["empty-icon"]} />
          <p className={styles["empty-text"]}>
            Your library is empty. Start uploading or purchasing documents to
            see them here.
          </p>
        </div>
      )}

      {state === "success" && (
        <div className={styles["documents-container"]}>
          <div className={styles["documents-grid"]}>
            {documents.map((doc) => (
              <div key={doc.id} className={styles["document-card"]}>
                {/* Card Header - Thumbnail */}
                <Link href={`/docs-view/${doc.id}`} className={styles["card-thumbnail-container"]}>
                  <div className={styles["card-thumbnail"]}>
                    {(() => {
                      const sanitizedThumbnailUrl = sanitizeImageUrl(
                        doc.thumbnailUrl,
                        THUMBNAIL_BASE_URL,
                        DEFAULT_THUMBNAIL
                      );
                      
                      const imageSrc = sanitizedThumbnailUrl || DEFAULT_THUMBNAIL;
                      const isExternalUrl = imageSrc.startsWith("http://") || imageSrc.startsWith("https://");
                      const isBlobUrl = imageSrc.startsWith("blob:");
                      
                      if (isExternalUrl || isBlobUrl || imageSrc.startsWith("/")) {
                        return (
                          <img
                            src={imageSrc}
                            alt={doc.documentName}
                            className={styles["thumbnail-image"]}
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              // Fallback to default image on error
                              if (target.src !== DEFAULT_THUMBNAIL) {
                                target.src = DEFAULT_THUMBNAIL;
                              }
                            }}
                          />
                        );
                      }
                      
                      // Fallback to default if sanitization fails
                      return (
                        <img
                          src={DEFAULT_THUMBNAIL}
                          alt={doc.documentName}
                          className={styles["thumbnail-image"]}
                        />
                      );
                    })()}
                  </div>
                  <span
                    className={`${styles["card-source-badge"]} ${
                      doc.source === "UPLOADED"
                        ? styles["source-uploaded"]
                        : styles["source-redeemed"]
                    }`}
                  >
                    {doc.source === "UPLOADED" ? "Uploaded" : "Redeemed"}
                  </span>
                </Link>

                {/* Card Body */}
                <div className={styles["card-body"]}>
                  {/* Title and Action Icons */}
                  <div className={styles["card-header"]}>
                    <h3 className={styles["card-title"]}>{doc.documentName}</h3>
                    <div className={styles["card-actions"]}>
                      <Link
                        href={`/docs-view/${doc.id}`}
                        className={styles["card-action-btn"]}
                        title="View Details"
                      >
                        <Eye className={styles["card-action-icon"]} />
                      </Link>
                      {doc.source === "UPLOADED" && (
                        <>
                          <button
                            onClick={() => handleEdit(doc)}
                            className={styles["card-action-btn"]}
                            title="Edit"
                          >
                            <Edit className={styles["card-action-icon"]} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            className={styles["card-action-btn"]}
                            title="Delete"
                          >
                            <Trash2 className={styles["card-action-icon"]} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className={styles["card-metadata"]}>
                    <div className={styles["metadata-item"]}>
                      <Calendar className={styles["metadata-icon"]} />
                      <div className={styles["metadata-content"]}>
                        <span className={styles["metadata-label"]}>
                          Upload Date
                        </span>
                        <span className={styles["metadata-value"]}>
                          {formatDate(doc.uploadDate)}
                        </span>
                      </div>
                    </div>
                    <div className={styles["metadata-item"]}>
                      <FileType className={styles["metadata-icon"]} />
                      <div className={styles["metadata-content"]}>
                        <span className={styles["metadata-label"]}>Type</span>
                        <span className={styles["metadata-value"]}>
                          {doc.type}
                        </span>
                      </div>
                    </div>
                    <div className={styles["metadata-item"]}>
                      <FolderOpen className={styles["metadata-icon"]} />
                      <div className={styles["metadata-content"]}>
                        <span className={styles["metadata-label"]}>Domain</span>
                        <span className={styles["metadata-value"]}>
                          {doc.domain}
                        </span>
                      </div>
                    </div>
                    <div className={styles["metadata-item"]}>
                      <HardDrive className={styles["metadata-icon"]} />
                      <div className={styles["metadata-content"]}>
                        <span className={styles["metadata-label"]}>
                          File Size
                        </span>
                        <span className={styles["metadata-value"]}>
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles["pagination-wrapper"]}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                loading={isLoading}
              />
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {selectedDocument && (
        <EditDocumentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDocument(null);
          }}
          onSave={handleEditSave}
          document={selectedDocument}
        />
      )}

      {/* Delete Modal */}
      {selectedDocument && (
        <DeleteDocumentModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedDocument(null);
          }}
          onDelete={handleDeleteConfirm}
          documentName={selectedDocument.documentName}
        />
      )}
    </main>
  );
}
