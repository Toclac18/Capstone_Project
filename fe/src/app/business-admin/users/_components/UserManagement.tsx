// src/app/business-admin/users/_components/UserManagement.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, UserResponse, UserQueryParams } from "../api";
import { getUsers, updateUserStatus } from "../api";
import { UserFilters } from "./UserFilters";
import { Pagination } from "./Pagination";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import StatusConfirmation from "@/components/ui/status-confirmation";
import { useToast, toast } from "@/components/ui/toast";
import { Eye } from "lucide-react";
import styles from "../styles.module.css";

export function UserManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [filters, setFilters] = useState<UserQueryParams>({
    page: 1,
    limit: 10,
    search: "",
    role: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch users with current filters
  const fetchUsers = useCallback(async (queryParams: UserQueryParams) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response: UserResponse = await getUsers({
        ...queryParams,
        limit: itemsPerPage,
      });
      setUsers(response.users);
      setTotalItems(response.total);
      setCurrentPage(response.page);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to fetch users";
      setError(errorMessage);
      setUsers([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Initial load - only once on mount
  useEffect(() => {
    fetchUsers(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters: UserQueryParams) => {
    const updatedFilters = { ...newFilters, limit: itemsPerPage };
    setFilters(updatedFilters);
    fetchUsers(updatedFilters);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    fetchUsers(updatedFilters);
  };

  const handleUpdateStatus = async (newStatus: "ACTIVE" | "INACTIVE", userId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserStatus(userId, newStatus);
      showToast(toast.success("Status Updated", `User status updated to ${newStatus} successfully`));
      await fetchUsers(filters);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to update user status";
      showToast(toast.error("Update Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string | number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUserStatus(String(userId), "DELETED");
      showToast(toast.success("User Deleted", "User deleted successfully"));
      await fetchUsers(filters);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to delete user";
      showToast(toast.error("Delete Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = (_userId: string) => {
    // TODO: Navigate to user detail page when implemented
    showToast(toast.info("Coming Soon", "User detail page will be available soon"));
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return styles["status-active"];
      case "PENDING_VERIFICATION":
        return styles["status-pending"];
      case "INACTIVE":
      case "DEACTIVE":
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

      {/* Users Table */}
      <div className={styles["table-container"]}>
        <div className="overflow-x-auto">
          <table className={styles["table"]}>
            <thead className={styles["table-header"]}>
              <tr>
                <th className={styles["table-header-cell"]}>Name</th>
                <th className={styles["table-header-cell"]}>Email</th>
                <th className={styles["table-header-cell"]}>Role</th>
                <th className={styles["table-header-cell"]}>Status</th>
                <th className={styles["table-header-cell"]}>Created At</th>
                <th className={styles["table-header-cell"]}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles["table-body"]}>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles["loading-container"]}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles["empty-container"]}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className={styles["table-row"]}>
                    <td className={styles["table-cell"]}>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {user.name?.charAt(0) ||
                              user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className={styles["table-cell-main"]}>
                            {user.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={styles["table-cell"]}>{user.email}</td>
                    <td className={styles["table-cell"]}>
                      <span className={styles["role-badge"]}>{user.role}</span>
                    </td>
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
                        <div className={styles["status-btn-wrapper"]}>
                          <StatusConfirmation
                            onConfirm={(status) => handleUpdateStatus(status, user.id)}
                            currentStatus={(user.status === "ACTIVE") ? "ACTIVE" : "INACTIVE"}
                            itemName={user.name || user.email}
                            title={
                              user.status === "ACTIVE"
                                ? "Confirm Inactive Status"
                                : "Confirm Active Status"
                            }
                            description={
                              user.status === "ACTIVE"
                                ? `Are you sure you want to set "${user.name || user.email}" to Inactive?`
                                : `Are you sure you want to set "${user.name || user.email}" to Active?`
                            }
                            size="sm"
                            variant="outline"
                          />
                        </div>
                        <DeleteConfirmation
                          onDelete={handleDelete}
                          itemId={user.id}
                          itemName={user.name || user.email}
                          title="Delete User"
                          description={`Are you sure you want to delete "${user.name || user.email}"?`}
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

