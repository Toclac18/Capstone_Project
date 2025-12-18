"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, UserPlus, UserCog, Clock, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import {
  getReviewManagement,
  type ReviewManagementItem,
} from "@/services/review-request.service";
import type { DocumentListItem } from "../../document/api";
import { AssignReviewerModal } from "../../document/_components/AssignReviewerModal";
import { ReviewDetailModal } from "./ReviewDetailModal";
import { Pagination } from "@/app/business-admin/users/_components/Pagination";
import styles from "../../document/styles.module.css";

type TabType = "needs-assignment" | "pending" | "in-review" | "completed" | "all";

export function ReviewManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("needs-assignment");
  const [items, setItems] = useState<ReviewManagementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDocument, setSelectedDocument] = useState<DocumentListItem | null>(null);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState<ReviewManagementItem | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReviewDetailModal, setShowReviewDetailModal] = useState(false);
  const [selectedReviewRequestId, setSelectedReviewRequestId] = useState<string | null>(null);
  // searchInput: giá trị trong ô input
  // searchQuery: giá trị thực tế gửi lên API (chỉ đổi khi bấm Search / Enter)
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "createdAt" | "deadline">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  const mapTabToServer = (tab: TabType):
    | "NEEDS_ASSIGNMENT"
    | "PENDING"
    | "IN_REVIEW"
    | "COMPLETED"
    | "ALL" => {
    switch (tab) {
      case "needs-assignment":
        return "NEEDS_ASSIGNMENT";
      case "pending":
        return "PENDING";
      case "in-review":
        return "IN_REVIEW";
      case "completed":
        return "COMPLETED";
      case "all":
      default:
        return "ALL";
    }
  };

  // Fetch data from backend (server-side pagination & filter)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const serverTab = mapTabToServer(activeTab);
      const res = await getReviewManagement({
        tab: serverTab,
        reviewerId: selectedReviewerId || undefined,
        domain: selectedDomainId || undefined,
        search: searchQuery || undefined,
        sortBy,
        sortOrder,
        page: currentPage,
        size: itemsPerPage,
      });

      setItems(res.items);
      setTotalItems(res.total);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to fetch documents";
      setError(errorMessage);
      setItems([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedReviewerId, selectedDomainId, searchQuery, sortBy, sortOrder, currentPage, itemsPerPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput.trim());
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get unique reviewers from review requests
  const availableReviewers = useMemo(() => {
    const reviewerMap = new Map<string, { id: string; name: string; email: string }>();
    items.forEach((item) => {
      if (item.reviewerId && item.reviewerName && !reviewerMap.has(item.reviewerId)) {
        reviewerMap.set(item.reviewerId, {
          id: item.reviewerId,
          name: item.reviewerName,
          email: item.reviewerEmail || "",
        });
      }
    });
    return Array.from(reviewerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // Get unique domains from documents
  const availableDomains = useMemo(() => {
    const domainMap = new Map<string, string>();
    items.forEach((item) => {
      if (item.specializationName) {
        const parts = item.specializationName.split(" - ");
        if (parts.length > 1) {
          const domain = parts[0];
          if (!domainMap.has(domain)) {
            domainMap.set(domain, domain);
          }
        }
      }
    });
    return Array.from(domainMap.values()).sort();
  }, [items]);

  const paginationTotal = totalItems;

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSelectedReviewerId(null);
    setSelectedDomainId(null);
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAssignSuccess = () => {
    fetchData();
    setShowAssignModal(false);
    setSelectedDocument(null);
    setSelectedReviewRequest(null); // Clear selected review request after assignment
  };

  const handleViewDetail = (item: ReviewManagementItem) => {
    // If in completed tab and has review request, show review detail modal
    if (activeTab === "completed" && item.reviewRequestId) {
      setSelectedReviewRequestId(item.reviewRequestId);
      setShowReviewDetailModal(true);
    } else {
      // Otherwise, navigate to document detail page
      router.push(`/business-admin/document/${item.documentId}`);
    }
  };

  const handleAssignClick = (item: ReviewManagementItem) => {
    const doc: any = {
      id: item.documentId,
      title: item.title,
      specializationName: item.specializationName,
      status: item.documentStatus,
      isPremium: item.isPremium,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
    setSelectedDocument(doc);
    setSelectedReviewRequest(null);
    setShowAssignModal(true);
  };

  const handleChangeReviewerClick = (item: ReviewManagementItem) => {
    console.log("[ReviewManagement] Change reviewer clicked:", {
      documentId: item.documentId,
      reviewRequestId: item.reviewRequestId,
      reviewRequestStatus: item.reviewRequestStatus,
    });
    const doc: any = {
      id: item.documentId,
      title: item.title,
      specializationName: item.specializationName,
      status: item.documentStatus,
      isPremium: item.isPremium,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
    setSelectedDocument(doc);
    setSelectedReviewRequest(item);
    setShowAssignModal(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "REVIEWING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const tabs = [
    { id: "needs-assignment" as TabType, label: "Needs Assignment", count: null },
    { id: "pending" as TabType, label: "Pending", count: null },
    { id: "in-review" as TabType, label: "In Review", count: null },
    { id: "completed" as TabType, label: "Completed", count: null },
    { id: "all" as TabType, label: "All", count: null },
  ];

  return (
    <div className={styles["container"]}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={styles["page-title"]}>Review Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage premium document reviews and assignments
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className={styles["alert"] + " " + styles["alert-error"]}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 rounded-[10px] bg-white p-2 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex gap-1 border-b border-transparent">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                handleResetFilters();
              }}
              className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-sm dark:bg-primary"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <div className="flex flex-1 min-w-[260px] max-w-xl gap-2 items-stretch">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search documents..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 focus:outline-none"
                  aria-label="Clear search"
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              )}
            </div>
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex h-full items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Filter by Reviewer */}
          {(activeTab === "pending" || activeTab === "in-review" || activeTab === "completed" || activeTab === "all") && (
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reviewer
              </label>
              <select
                value={selectedReviewerId || ""}
                onChange={(e) => {
                  setSelectedReviewerId(e.target.value || null);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Reviewers</option>
                {availableReviewers.map((reviewer) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter by Domain */}
          {availableDomains.length > 0 && (
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Domain
              </label>
              <select
                value={selectedDomainId || ""}
                onChange={(e) => {
                  setSelectedDomainId(e.target.value || null);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Domains</option>
                {availableDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort By */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as "title" | "createdAt" | "deadline");
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
              {(activeTab === "pending" || activeTab === "in-review") && (
                <option value="deadline">Deadline</option>
              )}
            </select>
          </div>

          {/* Sort Order */}
          <div className="min-w-[140px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as "asc" | "desc");
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className={`${styles["table-container"]} mt-6`}>
        <div className="overflow-x-auto">
          <table className={styles["table"]}>
            <thead className={styles["table-header"]}>
              <tr>
                <th className={styles["table-header-cell"]}>Title</th>
                {activeTab === "completed" && (
                  <>
                    <th className={styles["table-header-cell"]}>Premium</th>
                    <th className={styles["table-header-cell"]}>Decision</th>
                  </>
                )}
                <th className={styles["table-header-cell"]}>Document Status</th>
                <th className={styles["table-header-cell"]}>Review Request Status</th>
                <th className={styles["table-header-cell"]}>Reviewer</th>
                <th className={styles["table-header-cell"]}>Deadline</th>
                <th className={styles["table-header-cell"]}>Created At</th>
                <th className={styles["table-header-cell"]}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles["table-body"]}>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === "completed" ? 9 : 7} className={styles["loading-container"]}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading documents...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "completed" ? 9 : 7} className={styles["empty-container"]}>
                    No documents found.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const decision = activeTab === "completed"
                    ? item.decision || null
                    : null;

                  return (
                    <tr key={item.documentId} className={styles["table-row"]}>
                      <td className={styles["table-cell"]}>
                        <div className={styles["table-cell-main"]}>
                          {item.title || "N/A"}
                        </div>
                      </td>
                      {activeTab === "completed" && (
                        <>
                          <td className={styles["table-cell"]}>
                            {decision === "APPROVED" && item.isPremium ? (
                              <span
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              >
                                Premium
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className={styles["table-cell"]}>
                            {decision ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                  decision === "APPROVED"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                }`}
                              >
                                {decision === "APPROVED" ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                                <span>{decision}</span>
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className={styles["table-cell"]}>
                        <span
                          className={`${styles["status-badge"]} ${getStatusBadgeClass(item.documentStatus || "")}`}
                        >
                          {item.documentStatus
                            ? item.documentStatus.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                            : "N/A"}
                        </span>
                      </td>
                      <td className={styles["table-cell"]}>
                        {item.reviewRequestStatus ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              item.reviewRequestStatus === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : item.reviewRequestStatus === "ACCEPTED"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : item.reviewRequestStatus === "REJECTED"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : item.reviewRequestStatus === "EXPIRED"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                          >
                            {item.reviewRequestStatus === "PENDING" && <Clock className="w-3 h-3" />}
                            {item.reviewRequestStatus === "ACCEPTED" && <Clock className="w-3 h-3" />}
                            {item.reviewRequestStatus === "REJECTED" && <XCircle className="w-3 h-3" />}
                            {item.reviewRequestStatus === "EXPIRED" && <AlertCircle className="w-3 h-3" />}
                            <span>{item.reviewRequestStatus}</span>
                          </span>
                        ) : item.documentStatus === "PENDING_REVIEW" ? (
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>No Review Request</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {item.reviewerName ? (
                          <div className="text-sm">
                            <div className="font-medium">{item.reviewerName || "N/A"}</div>
                            {item.reviewerEmail && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {item.reviewerEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {item.reviewRequestStatus ? (
                          (() => {
                            const deadline = item.reviewRequestStatus === "PENDING" 
                              ? item.responseDeadline 
                              : item.reviewRequestStatus === "ACCEPTED"
                              ? item.reviewDeadline
                              : null;
                            
                            if (!deadline) {
                              return <span className="text-gray-500">-</span>;
                            }
                            
                            const isOverdue = new Date(deadline) < new Date();
                            return (
                              <div className="text-sm">
                                {new Date(deadline).toLocaleDateString()}
                                {isOverdue && (
                                  <span className="ml-1 text-red-600 dark:text-red-400 text-xs">
                                    (Overdue)
                                  </span>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className={styles["table-cell"]}>
                        <div className={styles["action-cell"]}>
                          <button
                            onClick={() => handleViewDetail(item)}
                            className={styles["action-icon-btn"]}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.documentStatus === "PENDING_REVIEW" && !item.reviewRequestStatus && (
                            <button
                              onClick={() => handleAssignClick(item)}
                              className={styles["action-icon-btn"]}
                              title="Assign Reviewer"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          {item.reviewRequestStatus === "PENDING" && (
                            <button
                              onClick={() => handleChangeReviewerClick(item)}
                              className={styles["action-icon-btn"]}
                              title="Change Reviewer"
                            >
                              <UserCog className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - use filtered count for tabs that filter client-side */}
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(paginationTotal / itemsPerPage)}
          totalItems={paginationTotal}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>

      {/* Assign Reviewer Modal */}
      {showAssignModal && selectedDocument && (
        <AssignReviewerModal
          open={showAssignModal}
          documentId={selectedDocument.id}
          documentTitle={selectedDocument.title || "Document"}
          documentDomain={undefined} // Can be added if available
          documentSpecialization={selectedDocument.specializationName}
          existingReviewRequestId={selectedReviewRequest?.reviewRequestId || undefined} // For change reviewer
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
    </div>
  );
}

