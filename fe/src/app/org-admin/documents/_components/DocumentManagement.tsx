"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Eye,
  Globe,
  FileText,
  Filter,
  CheckCircle,
  Lock,
  ThumbsUp,
  X,
  XCircle,
  Power,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { useDocuments } from "../provider";
import { ConfirmModal } from "./ConfirmModal";
import { sanitizeImageUrl } from "@/utils/imageUrl";
import type { OrgDocument, DocStatus, DocVisibility } from "@/services/org-admin-documents.service";
import styles from "../styles.module.css";

const ITEMS_PER_PAGE = 10;
const THUMBNAIL_BASE_URL = "https://readee-bucket.s3.ap-southeast-1.amazonaws.com/public/doc-thumbs/";
const DEFAULT_THUMBNAIL = "/images/document.jpg";

export function DocumentManagement() {
  const { showToast } = useToast();
  const {
    data,
    loading,
    filters,
    setFilters,
    gotoPage,
    handleRelease,
    handleActivate,
    handleDeactivate,
  } = useDocuments();

  const [searchInput, setSearchInput] = useState(filters.search);
  const [confirmModal, setConfirmModal] = useState<{
    type: "activate" | "deactivate" | "release";
    document: OrgDocument;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const documents = data?.data ?? [];
  const totalPages = data?.pageInfo?.totalPages ?? 1;
  const totalItems = data?.pageInfo?.totalElements ?? 0;

  const stats = useMemo(() => {
    const active = documents.filter((d) => d.status === "ACTIVE").length;
    const inactive = documents.filter((d) => d.status === "INACTIVE").length;
    return { active, inactive, total: documents.length };
  }, [documents]);

  const handleSearch = () => {
    setFilters({ search: searchInput });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setFilters({ search: "", status: "ALL" });
  };

  const handleStatusFilterChange = (status: DocStatus | "ALL") => {
    setFilters({ status });
  };

  const handlePageChange = (page: number) => {
    gotoPage(page);
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;

    setActionLoading(true);
    try {
      const { type, document } = confirmModal;
      
      if (type === "activate") {
        await handleActivate(document.id);
        showToast({
          type: "success",
          title: "Success",
          message: "Document activated successfully",
        });
      } else if (type === "deactivate") {
        await handleDeactivate(document.id);
        showToast({
          type: "success",
          title: "Success",
          message: "Document deactivated successfully",
        });
      } else if (type === "release") {
        await handleRelease(document.id);
        showToast({
          type: "success",
          title: "Success",
          message: "Document released to public successfully",
        });
      }
      
      setConfirmModal(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Action failed";
      showToast({ type: "error", title: "Error", message: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: DocStatus) => {
    const statusMap: Record<string, { class: string; label: string }> = {
      ACTIVE: { class: styles["badge-active"], label: "Active" },
      INACTIVE: { class: styles["badge-inactive"], label: "Inactive" },
      PENDING_REVIEW: { class: styles["badge-pending"], label: "Pending Review" },
      REVIEWING: { class: styles["badge-pending"], label: "Reviewing" },
      PENDING_APPROVE: { class: styles["badge-pending"], label: "Pending Approve" },
    };
    const config = statusMap[status] || { class: styles["badge-inactive"], label: status };
    return <span className={`${styles.badge} ${config.class}`}>{config.label}</span>;
  };

  const getVisibilityBadge = (visibility: DocVisibility) => {
    if (visibility === "PUBLIC") {
      return (
        <span className={`${styles.badge} ${styles["badge-public"]}`}>
          <Globe className="h-3 w-3" /> Public
        </span>
      );
    }
    return (
      <span className={`${styles.badge} ${styles["badge-internal"]}`}>
        <Lock className="h-3 w-3" /> Internal
      </span>
    );
  };

  return (
    <div className={styles.container}>
      {/* Stats Cards */}
      <div className={styles["stats-grid"]}>
        <div className={`${styles["stat-card"]} ${styles["stat-active"]}`}>
          <div className={styles["stat-icon-box"]}>
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.active}</span>
            <span className={styles["stat-label"]}>Active</span>
          </div>
        </div>
        <div className={`${styles["stat-card"]} ${styles["stat-inactive"]}`}>
          <div className={styles["stat-icon-box"]}>
            <XCircle className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.inactive}</span>
            <span className={styles["stat-label"]}>Inactive</span>
          </div>
        </div>
        <div className={`${styles["stat-card"]} ${styles["stat-total"]}`}>
          <div className={styles["stat-icon-box"]}>
            <FileText className="h-6 w-6" />
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
              placeholder="Search by document title..."
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
              value={filters.status}
              onChange={(e) => handleStatusFilterChange(e.target.value as DocStatus | "ALL")}
              className={styles["filter-select"]}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button onClick={handleClearFilters} className={styles["clear-btn"]}>
            <X className="h-4 w-4" /> Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles["table-card"]}>
        {loading ? (
          <div className={styles["loading-box"]}>
            <div className={styles.spinner} />
          </div>
        ) : documents.length === 0 ? (
          <div className={styles["empty-box"]}>
            <FileText className={styles["empty-icon"]} />
            <p className={styles["empty-text"]}>No documents found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={styles.table}>
                <thead>
                  <tr className={styles["table-head-row"]}>
                    <th className={styles.th}>Document</th>
                    <th className={styles.th}>Uploader</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Visibility</th>
                    <th className={styles.th}>Stats</th>
                    <th className={styles.th}>Created</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className={styles["table-row"]}>
                      <td className={styles.td}>
                        <div className={styles["doc-info"]}>
                          <Link href={`/docs-view/${doc.id}`} className={styles["doc-thumb-link"]}>
                            {(() => {
                              const sanitizedUrl = sanitizeImageUrl(
                                doc.thumbnailUrl,
                                THUMBNAIL_BASE_URL,
                                DEFAULT_THUMBNAIL
                              );
                              const imageSrc = sanitizedUrl || DEFAULT_THUMBNAIL;
                              
                              return (
                                <img
                                  src={imageSrc}
                                  alt={doc.title}
                                  className={styles["doc-thumb"]}
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    if (target.src !== DEFAULT_THUMBNAIL) {
                                      target.src = DEFAULT_THUMBNAIL;
                                    }
                                  }}
                                />
                              );
                            })()}
                          </Link>
                          <div>
                            <Link href={`/docs-view/${doc.id}`} className={styles["doc-title-link"]}>
                              <p className={styles["doc-title"]}>{doc.title}</p>
                            </Link>
                            <p className={styles["doc-meta"]}>
                              {doc.docType?.name || "Unknown"} • {doc.specialization?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles["uploader-info"]}>
                          <div>
                            <p className={styles["uploader-name"]}>
                              {doc.uploader?.fullName || "Unknown"}
                            </p>
                            <p className={styles["uploader-email"]}>
                              {doc.uploader?.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={styles.td}>{getStatusBadge(doc.status)}</td>
                      <td className={styles.td}>{getVisibilityBadge(doc.visibility)}</td>
                      <td className={styles.td}>
                        <div className={styles["stats-cell"]}>
                          <span className={styles["stat-item"]}>
                            <Eye className="h-4 w-4" /> {doc.viewCount}
                          </span>
                          <span className={styles["stat-item"]}>
                            <ThumbsUp className="h-4 w-4" /> {doc.upvoteCount}
                          </span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles["date-text"]}>
                          {formatDate(doc.createdAt)}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actions}>
                          {doc.status === "INACTIVE" && (
                            <button
                              onClick={() => setConfirmModal({ type: "activate", document: doc })}
                              className={`${styles["action-btn"]} ${styles["action-activate"]}`}
                              title="Activate"
                            >
                              <Power className="h-4 w-4" />
                            </button>
                          )}
                          {doc.status === "ACTIVE" && (
                            <>
                              <button
                                onClick={() => setConfirmModal({ type: "deactivate", document: doc })}
                                className={`${styles["action-btn"]} ${styles["action-deactivate"]}`}
                                title="Deactivate"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setConfirmModal({ type: "release", document: doc })}
                                className={`${styles["action-btn"]} ${styles["action-release"]}`}
                                title="Release to Public"
                              >
                                <Globe className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className={styles["pagination-box"]}>
                <Pagination
                  currentPage={filters.page}
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

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          type={confirmModal.type}
          doc={confirmModal.document}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}
