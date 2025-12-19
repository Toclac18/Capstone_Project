// Role Management Component
"use client";

import { useState, useEffect, useCallback } from "react";
import type { User, UserResponse, UserQueryParams } from "@/types/user";
import { getUsersForRoleManagement, changeUserRole } from "@/services/roleManagementService";
import { RoleFilters } from "./RoleFilters";
import { Pagination } from "@/app/business-admin/users/_components/Pagination";
import ChangeRoleModal from "@/components/ui/change-role-modal";
import { useToast, toast } from "@/components/ui/toast";
import styles from "../styles.module.css";

export function RoleManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

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
      const response: UserResponse = await getUsersForRoleManagement({
        ...queryParams,
        limit: itemsPerPage,
      });
      setUsers(response?.users || []);
      setTotalItems(response?.total || 0);
      setCurrentPage(response?.page || 1);
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

  // Get current user identifier (ID or email) for comparison
  useEffect(() => {
    // Try to get from localStorage first (faster, no API call)
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId");
      const storedUserEmail = localStorage.getItem("userEmail");
      
      if (storedUserId) {
        setCurrentUserId(String(storedUserId).trim());
      }
      if (storedUserEmail) {
        setCurrentUserEmail(String(storedUserEmail).trim().toLowerCase());
      }
    }
  }, []);

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

  const handleChangeRole = async (
    userId: string,
    newRole: string,
    reason?: string
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await changeUserRole(userId, { role: newRole as any, reason });
      showToast(
        toast.success(
          "Role Changed",
          `User role changed to ${newRole} successfully`
        )
      );
      await fetchUsers(filters);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to change user role";
      showToast(toast.error("Change Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case "SYSTEM_ADMIN":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "BUSINESS_ADMIN":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "ORGANIZATION_ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "REVIEWER":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "READER":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className={styles["container"]}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={styles["page-title"]}>Role Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage user roles and permissions. Change user roles to control access and capabilities.
        </p>
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
      <RoleFilters onFiltersChange={handleFiltersChange} loading={loading} />

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
                      <span className={`${styles["role-badge"]} ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                      </span>
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
                        <div className={styles["status-btn-wrapper"]}>
                          {(() => {
                            // Check by ID first
                            const normalizedCurrentId = currentUserId ? String(currentUserId).trim().toLowerCase() : null;
                            const normalizedUserId = user.id ? String(user.id).trim().toLowerCase() : null;
                            const isOwnAccountById = normalizedCurrentId && normalizedUserId && normalizedCurrentId === normalizedUserId;
                            
                            // Fallback: check by email
                            const normalizedCurrentEmail = currentUserEmail ? String(currentUserEmail).trim().toLowerCase() : null;
                            const normalizedUserEmail = user.email ? String(user.email).trim().toLowerCase() : null;
                            const isOwnAccountByEmail = normalizedCurrentEmail && normalizedUserEmail && normalizedCurrentEmail === normalizedUserEmail;
                            
                            const isOwnAccount = isOwnAccountById || isOwnAccountByEmail;
                            
                            if (isOwnAccount) {
                              return (
                                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                                  Cannot change own role
                                </span>
                              );
                            }
                            
                            return (
                              <ChangeRoleModal
                                onConfirm={(role, reason) =>
                                  handleChangeRole(user.id, role, reason)
                                }
                                currentRole={user.role as any}
                                userName={user.name || user.email}
                                userId={user.id}
                                title="Change User Role"
                                description={`Change the role for "${user.name || user.email}"`}
                                size="sm"
                                variant="outline"
                              />
                            );
                          })()}
                        </div>
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

