// src/app/admin/system-logs/_components/SystemLogManagement.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  SystemLog,
  SystemLogQueryParams,
  SystemLogListResponse,
} from "@/types/system-log";
import { getSystemLogs } from "@/services/systemLogService";
import { SystemLogFilters } from "./SystemLogFilters";
import { Pagination } from "@/app/business-admin/users/_components/Pagination";
import styles from "../styles.module.css";
import { Eye, AlertCircle } from "lucide-react";

const formatAction = (action: string): string => {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function SystemLogManagement() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);

  const [filters, setFilters] = useState<SystemLogQueryParams>({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch logs from API
  const fetchLogs = useCallback(async (queryParams: SystemLogQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const updatedFilters = { ...queryParams, limit: itemsPerPage };
      const response: SystemLogListResponse = await getSystemLogs(updatedFilters);
      setLogs(response.logs);
      setTotalItems(response.total);
      setCurrentPage(response.page);
      setFilters(updatedFilters);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : "Failed to fetch system logs";
      setError(errorMessage);
      setLogs([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Initial load
  useEffect(() => {
    fetchLogs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters: SystemLogQueryParams) => {
    const updatedFilters = { ...newFilters, limit: itemsPerPage };
    fetchLogs(updatedFilters);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    fetchLogs(updatedFilters);
  };

  const handleViewDetails = (log: SystemLog) => {
    setSelectedLog(log);
  };

  const handleCloseDetails = () => {
    setSelectedLog(null);
  };

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  };

  return (
    <div className={styles["container"]}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={styles["page-title"]}>System Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and monitor system activity and audit logs
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className={styles["alert"] + " " + styles["alert-error"]}>
          {error}
        </div>
      )}

      {/* Filters */}
      <SystemLogFilters
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      {/* Logs Table */}
      <div className={styles["table-container"]}>
        <div className="overflow-x-auto">
          <table className={styles["table"]}>
            <thead className={styles["table-header"]}>
              <tr>
                <th className={styles["table-header-cell"]}>Action</th>
                <th className={styles["table-header-cell"]}>User</th>
                <th className={styles["table-header-cell"]}>Role</th>
                <th className={styles["table-header-cell"]}>IP Address</th>
                <th className={styles["table-header-cell"]}>Status</th>
                <th className={styles["table-header-cell"]}>Date & Time</th>
                <th className={styles["table-header-cell"]}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles["table-body"]}>
              {loading ? (
                <tr>
                  <td colSpan={7} className={styles["loading-container"]}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles["empty-container"]}>
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isError = log.statusCode && log.statusCode >= 400;

                  return (
                    <tr key={log.id} className={styles["table-row"]}>
                      <td className={styles["table-cell"]}>
                        <div className={styles["table-cell-main"]}>
                          {formatAction(log.action)}
                        </div>
                      </td>
                      <td className={styles["table-cell"]}>
                        {log.userId ? (
                          <span className="text-sm">
                            {log.userId.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {log.userRole || "N/A"}
                      </td>
                      <td className={styles["table-cell"]}>
                        {log.ipAddress || "N/A"}
                      </td>
                      <td className={styles["table-cell"]}>
                        {log.statusCode ? (
                          <span
                            className={`${styles["status-badge"]} ${
                              isError
                                ? styles["status-inactive"]
                                : styles["status-active"]
                            }`}
                          >
                            {log.statusCode}
                            {isError && (
                              <AlertCircle className="inline ml-1 w-3 h-3" />
                            )}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className={styles["table-cell"]}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td className={styles["table-cell"]}>
                        <div className={styles["action-cell"]}>
                          <button
                            onClick={() => handleViewDetails(log)}
                            className={styles["action-icon-btn"]}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Details Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCloseDetails}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Log Details
              </h2>
              <button
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Action:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {formatAction(selectedLog.action)}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">User ID:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {selectedLog.userId || "System"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Role:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {selectedLog.userRole || "N/A"}
                </span>
              </div>
              {selectedLog.targetUserId && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Target User:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {selectedLog.targetUserId}
                  </span>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">IP Address:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {selectedLog.ipAddress || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">User Agent:</span>
                <span className="ml-2 text-gray-900 dark:text-white break-all">
                  {selectedLog.userAgent || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Request:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {selectedLog.requestMethod} {selectedLog.requestPath}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Status Code:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {selectedLog.statusCode || "N/A"}
                </span>
              </div>
              {selectedLog.errorMessage && (
                <div>
                  <span className="font-semibold text-red-600 dark:text-red-400">Error:</span>
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    {selectedLog.errorMessage}
                  </span>
                </div>
              )}
              {selectedLog.details && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Details:</span>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                    {JSON.stringify(parseDetails(selectedLog.details), null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Created At:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {formatDate(selectedLog.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

