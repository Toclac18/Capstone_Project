// src/app/business-admin/organization/_components/OrganizationManagement.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  Organization,
  OrganizationResponse,
  OrganizationQueryParams,
} from "../api";
import {
  getOrganizations,
  deleteOrganization,
  updateOrganizationStatus,
} from "../api";
import { OrganizationFilters } from "./OrganizationFilters";
import { Pagination } from "@/app/business-admin/users/_components/Pagination";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import { useToast, toast } from "@/components/ui/toast";
import { Eye, Power } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import styles from "../styles.module.css";

// Helper function to check if logo is a valid URL
const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const trimmedUrl = url.trim();
  if (trimmedUrl === '') {
    return false;
  }
  try {
    const urlObj = new URL(trimmedUrl);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // If URL constructor fails, it's not a valid URL
    return false;
  }
};

export function OrganizationManagement() {
  const { showToast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [activateModal, setActivateModal] = useState<{
    open: boolean;
    userId: string;
    orgName: string;
  } | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const [filters, setFilters] = useState<OrganizationQueryParams>({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Fetch organizations from API
  const fetchOrganizations = useCallback(async (queryParams: OrganizationQueryParams) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedFilters = { ...queryParams, limit: itemsPerPage };
      const response: OrganizationResponse = await getOrganizations(updatedFilters);
      setOrganizations(response.organizations);
      setTotalItems(response.total);
      setCurrentPage(response.page);
      setFilters(updatedFilters);
      // Reset image errors when organizations change
      setImageErrors(new Set());
      // Debug: Log logo URLs
      response.organizations.forEach(org => {
        console.log(`Org ${org.id} - Logo:`, org.logo, `Valid:`, isValidImageUrl(org.logo));
      });
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : "Failed to fetch organizations";
      setError(errorMessage);
      setOrganizations([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  // Initial load - only once on mount
  useEffect(() => {
    fetchOrganizations(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters: OrganizationQueryParams) => {
    const updatedFilters = { ...newFilters, limit: itemsPerPage };
    fetchOrganizations(updatedFilters);
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    fetchOrganizations(updatedFilters);
  };

  const handleDelete = async (orgId: string | number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Find the organization to get userId (admin ID)
      const org = organizations.find(o => o.id === orgId || o.userId === orgId);
      if (!org) {
        throw new Error("Organization not found");
      }
      // Backend needs userId (admin ID), not organizationId
      const userId = org.userId || org.id;
      await deleteOrganization(String(userId));
      showToast(toast.success("Organization Deleted", "Organization deleted successfully"));
      await fetchOrganizations(filters);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to delete organization";
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
      // activateModal already contains userId
      await updateOrganizationStatus(activateModal.userId, "ACTIVE");
      showToast(toast.success("Organization Activated", "Organization activated successfully"));
      setActivateModal(null);
      await fetchOrganizations(filters);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to activate organization";
      showToast(toast.error("Activate Failed", errorMessage));
      setError(errorMessage);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDetail = (orgId: string, org: Organization) => {
    // Backend API needs userId (admin ID), not organizationId
    // Use userId if available, otherwise fallback to id
    const userId = org.userId || orgId;
    window.location.href = `/business-admin/organization/${userId}`;
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
        return styles["status-rejected"];
      case "DELETED":
        return styles["status-deleted"];
      default:
        return styles["status-inactive"];
    }
  };

  return (
    <div className={styles["container"]}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={styles["page-title"]}>Organization Management</h1>
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
      <OrganizationFilters
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      {/* Spacing between filters and table */}
      <div className="mb-4"></div>

      {/* Organizations Table */}
      <div className={styles["table-container"]}>
        <div className="overflow-x-auto">
          <table className={styles["table"]}>
            <thead className={styles["table-header"]}>
              <tr>
                <th className={styles["table-header-cell"]}>Logo</th>
                <th className={styles["table-header-cell"]}>Organization Name</th>
                <th className={styles["table-header-cell"]}>Organization Email</th>
                <th className={styles["table-header-cell"]}>Phone</th>
                <th className={styles["table-header-cell"]}>Admin Email</th>
                <th className={styles["table-header-cell"]}>Status</th>
                <th className={styles["table-header-cell"]}>Created At</th>
                <th className={styles["table-header-cell"]}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles["table-body"]}>
              {loading ? (
                <tr>
                  <td colSpan={8} className={styles["loading-container"]}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading organizations...</span>
                    </div>
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles["empty-container"]}>
                    No organizations found.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className={styles["table-row"]}>
                    <td className={styles["table-cell"]}>
                      {isValidImageUrl(org.logo) && !imageErrors.has(org.id) ? (
                        <img
                          src={org.logo!.trim()}
                          alt={org.name || org.email}
                          className={styles["logo"]}
                          crossOrigin="anonymous"
                          onError={(e) => {
                            // If crossOrigin fails, try without it
                            const img = e.currentTarget as HTMLImageElement;
                            if (img.crossOrigin === 'anonymous') {
                              // Try without crossOrigin
                              img.crossOrigin = '';
                              img.src = org.logo!.trim();
                            } else {
                              // Both attempts failed, show placeholder
                              console.error(`Failed to load image for org ${org.id}:`, org.logo);
                              setImageErrors(prev => new Set(prev).add(org.id));
                            }
                          }}
                          onLoad={() => {
                            console.log(`Image loaded successfully for org ${org.id}:`, org.logo);
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles["logo-placeholder"]}>
                          <span className={styles["logo-text"]}>
                            {(org.name || org.email)
                              .substring(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className={styles["table-cell"]}>
                      <div className={styles["table-cell-main"]}>
                        {org.name || org.email}
                      </div>
                    </td>
                    <td className={styles["table-cell"]}>
                      {org.email}
                    </td>
                    <td className={styles["table-cell"]}>{org.hotline}</td>
                    <td className={styles["table-cell"]}>{org.adminEmail}</td>
                    <td className={styles["table-cell"]}>
                      <span
                        className={`${styles["status-badge"]} ${getStatusBadgeClass(org.status)}`}
                      >
                        {org.status || (org.active ? "ACTIVE" : "INACTIVE")}
                      </span>
                    </td>
                    <td className={styles["table-cell"]}>
                      {org.createdAt
                        ? new Date(org.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className={styles["table-cell"]}>
                      <div className={styles["action-cell"]}>
                        <button
                          onClick={() => handleDetail(org.id, org)}
                          className={styles["action-icon-btn"]}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {org.status === "DELETED" ? (
                          <button
                            onClick={() => {
                              // Backend needs userId (admin ID), not organizationId
                              const userId = org.userId || org.id;
                              setActivateModal({
                                open: true,
                                userId: String(userId),
                                orgName: org.name || org.email,
                              });
                            }}
                            disabled={loading || isActivating}
                            className="h-9 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-green-300 bg-white text-green-600 hover:text-green-700 hover:border-green-400 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-green-300 disabled:hover:bg-white shadow-sm hover:shadow-md dark:border-green-700 dark:bg-gray-800 dark:text-green-400 dark:hover:text-green-300 dark:hover:border-green-600 dark:hover:bg-green-900/20 dark:disabled:hover:border-green-700 dark:disabled:hover:bg-gray-800"
                            title="Activate Organization"
                          >
                            <Power className="w-4 h-4" />
                            <span>Activate</span>
                          </button>
                        ) : (
                          <DeleteConfirmation
                            onDelete={handleDelete}
                            itemId={org.id}
                            itemName={org.name || org.email}
                            title="Delete Organization"
                            description={`Are you sure you want to delete "${org.name || org.email}"?`}
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

        {/* Activate Confirmation Modal */}
        {activateModal && (
          <ConfirmModal
            open={activateModal.open}
            title="Activate Organization"
            content={`Are you sure you want to activate "${activateModal.orgName}"?`}
            subContent="This will change the organization status to ACTIVE and allow them to access the system."
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

