// src/app/business-admin/users/_components/UserManagement.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, UserResponse, UserQueryParams } from "../api";
import { getReaders, getReviewers, updateReaderStatus, updateReviewerStatus } from "../api";
import { UserFilters } from "./UserFilters";
import { Pagination } from "./Pagination";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import { useToast, toast } from "@/components/ui/toast";
import { Eye, Power } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import styles from "../styles.module.css";

type UserType = "readers" | "reviewers";

export function UserManagement() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<UserType>("readers");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activateModal, setActivateModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  } | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const [filters, setFilters] = useState<UserQueryParams>({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch users with current filters based on active tab
  const fetchUsers = useCallback(async (queryParams: UserQueryParams, userType: UserType) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response: UserResponse = userType === "readers"
        ? await getReaders({
            ...queryParams,
            limit: itemsPerPage,
          })
        : await getReviewers({
            ...queryParams,
            limit: itemsPerPage,
          });
      setUsers(response.users);
      setTotalItems(response.total);
      setCurrentPage(response.page);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : `Failed to fetch ${userType}`;
      setError(errorMessage);
      setUsers([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Fetch users when tab or filters change
  useEffect(() => {
    fetchUsers(filters, activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: UserQueryParams) => {
    const updatedFilters = { ...newFilters, limit: itemsPerPage };
    setFilters(updatedFilters);
    fetchUsers(updatedFilters, activeTab);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    fetchUsers(updatedFilters, activeTab);
  };

  // Handle tab changes
  const handleTabChange = (tab: UserType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    const resetFilters = { ...filters, page: 1 };
    setFilters(resetFilters);
    fetchUsers(resetFilters, tab);
  };

  const handleDelete = async (userId: string | number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (activeTab === "readers") {
        await updateReaderStatus(String(userId), "DELETED");
      } else {
        await updateReviewerStatus(String(userId), "DELETED");
      }
      showToast(toast.success("User Deleted", `${activeTab === "readers" ? "Reader" : "Reviewer"} deleted successfully`));
      await fetchUsers(filters, activeTab);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to delete user";
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
    setSuccess(null);

    try {
      if (activeTab === "readers") {
        await updateReaderStatus(activateModal.userId, "ACTIVE");
      } else {
        await updateReviewerStatus(activateModal.userId, "ACTIVE");
      }
      showToast(toast.success("User Activated", `${activeTab === "readers" ? "Reader" : "Reviewer"} activated successfully`));
      setActivateModal(null);
      await fetchUsers(filters, activeTab);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to activate user";
      showToast(toast.error("Activate Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDetail = (userId: string) => {
    const userType = activeTab === "readers" ? "readers" : "reviewers";
    window.location.href = `/business-admin/users/${userType}/${userId}`;
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return styles["status-active"];
      case "PENDING_EMAIL_VERIFY":
      case "PENDING_APPROVE":
        return styles["status-pending"];
      case "INACTIVE":
        return styles["status-inactive"];
      case "REJECTED":
        return styles["status-inactive"];
      case "DELETED":
        return styles["status-deleted"];
      default:
        return styles["status-deleted"];
    }
  };

  return (
    <div className={styles["container"]}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={styles["page-title"]}>User Management</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 rounded-lg border border-stroke bg-white p-4 shadow-default dark:border-dark-3 dark:bg-dark">
        <div className="flex space-x-1 border-b border-stroke dark:border-dark-3">
          <button
            onClick={() => handleTabChange("readers")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "readers"
                ? "border-b-2 border-primary text-primary dark:text-primary"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Readers
          </button>
          <button
            onClick={() => handleTabChange("reviewers")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "reviewers"
                ? "border-b-2 border-primary text-primary dark:text-primary"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Reviewers
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className={styles["alert"] + " " + styles["alert-success"]}>
          {success}
        </div>
      )}
      {error && (
        <div className={styles["alert"] + " " + styles["alert-error"]}>
          {error}
        </div>
      )}

      {/* Filters */}
      <UserFilters onFiltersChange={handleFiltersChange} loading={loading} />

      {/* Spacing between filters and table */}
      <div className="mb-4"></div>

      {/* Users Table */}
      <div className={styles["table-container"]}>
        <div className="overflow-x-auto">
          <table className={styles["table"]}>
            <thead className={styles["table-header"]}>
              <tr>
                <th className={styles["table-header-cell"]}>Name</th>
                <th className={styles["table-header-cell"]}>Email</th>
                {activeTab === "reviewers" && (
                  <th className={styles["table-header-cell"]}>Organization</th>
                )}
                <th className={styles["table-header-cell"]}>Status</th>
                <th className={styles["table-header-cell"]}>Created At</th>
                <th className={styles["table-header-cell"]} style={{ width: "120px" }}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles["table-body"]}>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === "reviewers" ? 6 : 5} className={styles["loading-container"]}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading {activeTab}...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "reviewers" ? 6 : 5} className={styles["empty-container"]}>
                    No {activeTab} found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={styles["table-row"]}>
                    <td className={styles["table-cell"]}>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {((user as any).fullName || user.name || user.email)?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className={styles["table-cell-main"]}>
                            {(user as any).fullName || user.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={styles["table-cell"]}>{user.email}</td>
                    {activeTab === "reviewers" && (
                      <td className={styles["table-cell"]}>
                        {(user as any).organizationName || "N/A"}
                      </td>
                    )}
                    <td className={styles["table-cell"]}>
                      <span
                        className={`${styles["status-badge"]} ${getStatusBadgeClass(user.status)}`}
                      >
                        {user.status || "UNKNOWN"}
                      </span>
                    </td>
                    <td className={styles["table-cell"]}>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className={styles["table-cell"]}>
                      <div className={styles["action-cell"]}>
                        <button
                          onClick={() => handleDetail(user.id)}
                          className={styles["action-icon-btn"]}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user.status === "DELETED" ? (
                          <button
                            onClick={() => setActivateModal({
                              open: true,
                              userId: user.id,
                              userName: (user as any).fullName || user.name || user.email,
                            })}
                            disabled={loading || isActivating}
                            className="h-9 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-green-300 bg-white text-green-600 hover:text-green-700 hover:border-green-400 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-green-300 disabled:hover:bg-white shadow-sm hover:shadow-md dark:border-green-700 dark:bg-gray-800 dark:text-green-400 dark:hover:text-green-300 dark:hover:border-green-600 dark:hover:bg-green-900/20 dark:disabled:hover:border-green-700 dark:disabled:hover:bg-gray-800"
                            title="Activate User"
                          >
                            <Power className="w-4 h-4" />
                            <span>Activate</span>
                          </button>
                        ) : (
                          <div className={styles["delete-btn-wrapper"]}>
                            <DeleteConfirmation
                              onDelete={handleDelete}
                              itemId={user.id}
                              itemName={(user as any).fullName || user.name || user.email}
                              title={`Delete ${activeTab === "readers" ? "Reader" : "Reviewer"}`}
                              description={`Are you sure you want to delete "${(user as any).fullName || user.name || user.email}"?`}
                              size="sm"
                              variant="outline"
                              className="!h-9 !px-3 !min-w-[90px]"
                            />
                          </div>
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

        {/* Activate Confirmation Modal */}
        {activateModal && (
          <ConfirmModal
            open={activateModal.open}
            title={`Activate ${activeTab === "readers" ? "Reader" : "Reviewer"}`}
            content={`Are you sure you want to activate "${activateModal.userName}"?`}
            subContent="This will change the user status to ACTIVE and allow them to access the system."
            confirmLabel="Activate"
            cancelLabel="Cancel"
            loading={isActivating}
            onConfirm={handleActivate}
            onCancel={() => setActivateModal(null)}
          />
        )}
      </div>
    </div>
  );
}

