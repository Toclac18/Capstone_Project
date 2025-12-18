"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileWarning,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";
import {
  getReports,
  type Report,
  type ReportStatus,
  type ReportReason,
  REPORT_STATUS_DISPLAY,
  REPORT_REASON_DISPLAY,
} from "../api";
import { ReportDetailModal } from "./ReportDetailModal";
import styles from "../styles.module.css";

const ITEMS_PER_PAGE = 10;

export function Reports() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>("desc");

  const [filters, setFilters] = useState<{
    status: ReportStatus | "";
    reason: ReportReason | "";
  }>({
    status: "",
    reason: "",
  });

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        size: ITEMS_PER_PAGE,
      };
      if (filters.status) params.status = filters.status;
      if (filters.reason) params.reason = filters.reason;

      const response = await getReports(params as any);
      setReports(response.data || []);
      setTotalPages(response.pageInfo?.totalPages || 1);
      setTotalItems(response.pageInfo?.totalElements || 0);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to load reports";
      showToast({ type: "error", title: "Error", message: msg });
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const stats = useMemo(() => {
    const pending = reports.filter((r) => r.status === "PENDING").length;
    const resolved = reports.filter((r) => r.status === "RESOLVED").length;
    return { pending, resolved, total: reports.length };
  }, [reports]);

  const handleClearFilters = () => {
    setFilters({ status: "", reason: "" });
    setSearchInput("");
    setSearchQuery("");
    setSortOrder("desc");
    setCurrentPage(0);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(0);
  };

  // Handle date sort toggle
  const handleDateSort = () => {
    if (sortOrder === undefined) {
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortOrder("asc");
    } else {
      setSortOrder(undefined);
    }
  };

  // Get sort icon
  const getDateSortIcon = () => {
    if (sortOrder === "asc") {
      return <ArrowUp className="w-4 h-4 ml-1 text-primary" />;
    } else if (sortOrder === "desc") {
      return <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
    }
    return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
  };

  // Filter and sort reports (client-side)
  const filteredReports = useMemo(() => {
    let result = reports;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.documentTitle?.toLowerCase().includes(query) ||
          r.reporter?.fullName?.toLowerCase().includes(query) ||
          r.reporter?.email?.toLowerCase().includes(query)
      );
    }

    // Sort by date
    if (sortOrder) {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
    }

    return result;
  }, [reports, searchQuery, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page - 1);
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleReportUpdated = () => {
    fetchReports();
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

  const getStatusBadge = (status: ReportStatus) => {
    const statusMap: Record<ReportStatus, string> = {
      PENDING: styles["badge-pending"],
      RESOLVED: styles["badge-resolved"],
    };
    return (
      <span className={`${styles.badge} ${statusMap[status] || styles["badge-pending"]}`}>
        {REPORT_STATUS_DISPLAY[status]}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <Breadcrumb pageName="Report Management" />

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
        <div className={`${styles["stat-card"]} ${styles["stat-resolved"]}`}>
          <div className={styles["stat-icon-box"]}>
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.resolved}</span>
            <span className={styles["stat-label"]}>Resolved</span>
          </div>
        </div>
        <div className={`${styles["stat-card"]} ${styles["stat-total"]}`}>
          <div className={styles["stat-icon-box"]}>
            <FileWarning className="h-6 w-6" />
          </div>
          <div className={styles["stat-content"]}>
            <span className={styles["stat-value"]}>{stats.total}</span>
            <span className={styles["stat-label"]}>Total</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={styles["filters-card"]}>
        <div className={styles["filters-row"]}>
          {/* Search */}
          <div className={styles["search-box"]}>
            <Search className={styles["search-icon"]} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by document or reporter..."
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
              onChange={(e) => {
                setFilters((f) => ({ ...f, status: e.target.value as ReportStatus | "" }));
                setCurrentPage(0);
              }}
              className={styles["filter-select"]}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <div className={styles["filter-select-box"]}>
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <select
              value={filters.reason}
              onChange={(e) => {
                setFilters((f) => ({ ...f, reason: e.target.value as ReportReason | "" }));
                setCurrentPage(0);
              }}
              className={styles["filter-select"]}
            >
              <option value="">All Reasons</option>
              <option value="INAPPROPRIATE_CONTENT">Inappropriate Content</option>
              <option value="COPYRIGHT_VIOLATION">Copyright Violation</option>
              <option value="SPAM">Spam</option>
              <option value="MISLEADING_INFORMATION">Misleading Information</option>
              <option value="DUPLICATE_CONTENT">Duplicate Content</option>
              <option value="QUALITY_ISSUES">Quality Issues</option>
              <option value="OTHER">Other</option>
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
            <div className={styles.spinner} />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className={styles["empty-box"]}>
            <FileText className={styles["empty-icon"]} />
            <p className={styles["empty-text"]}>No reports found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={styles.table}>
                <thead>
                  <tr className={styles["table-head-row"]}>
                    <th className={styles.th}>Document</th>
                    <th className={styles.th}>Reporter</th>
                    <th className={styles.th}>Reason</th>
                    <th className={styles.th}>Status</th>
                    <th
                      className={`${styles.th} ${styles["th-sortable"]}`}
                      onClick={handleDateSort}
                    >
                      <span className="flex items-center cursor-pointer">
                        Date
                        {getDateSortIcon()}
                      </span>
                    </th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className={styles["table-row"]}
                      onClick={() => handleViewReport(report)}
                    >
                      <td className={styles.td}>
                        <div className={styles["doc-info"]}>
                          <span className={styles["doc-title"]}>
                            {report.documentTitle}
                          </span>
                          <span className={styles["doc-id"]}>
                            {report.documentId.slice(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles["reporter-info"]}>
                          <span className={styles["reporter-name"]}>
                            {report.reporter?.fullName || "Unknown"}
                          </span>
                          <span className={styles["reporter-email"]}>
                            {report.reporter?.email || ""}
                          </span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles["reason-badge"]}>
                          {REPORT_REASON_DISPLAY[report.reason]}
                        </span>
                      </td>
                      <td className={styles.td}>{getStatusBadge(report.status)}</td>
                      <td className={styles.td}>
                        <span className={styles["date-text"]}>
                          {formatDate(report.createdAt)}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actions}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReport(report);
                            }}
                            className={`${styles["action-btn"]} ${styles["action-view"]}`}
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
            {totalPages > 1 && (
              <div className={styles["pagination-box"]}>
                <Pagination
                  currentPage={currentPage + 1}
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

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReport(null);
          }}
          onUpdated={handleReportUpdated}
        />
      )}
    </div>
  );
}
