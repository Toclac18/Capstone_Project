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
} from "../api";
import { OrganizationFilters } from "./OrganizationFilters";
import { Pagination } from "@/app/business-admin/users/_components/Pagination";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import { Eye } from "lucide-react";
import styles from "../styles.module.css";

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

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
      setFilters(updatedFilters);
      const response: OrganizationResponse = await getOrganizations(updatedFilters);
      setOrganizations(response.organizations);
      setTotalItems(response.total);
      setCurrentPage(response.page);
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

  // Initial load
  useEffect(() => {
    fetchOrganizations(filters);
  }, [fetchOrganizations, filters]);

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
      await deleteOrganization(String(orgId));
      setSuccess("Organization deleted successfully");
      await fetchOrganizations(filters);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to delete organization";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = (orgId: string) => {
    window.location.href = `/business-admin/organization/${orgId}`;
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
                      {org.logo && !imageErrors.has(org.id) ? (
                        <img
                          src={org.logo}
                          alt={org.name || org.email}
                          className={styles["logo"]}
                          onError={() => {
                            console.error(`Failed to load image for org ${org.id}:`, org.logo);
                            setImageErrors(prev => new Set(prev).add(org.id));
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
                        className={`${styles["status-badge"]} ${
                          org.status === "ACTIVE" || org.active
                            ? styles["status-active"]
                            : styles["status-inactive"]
                        }`}
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
                          onClick={() => handleDetail(org.id)}
                          className={styles["action-icon-btn"]}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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

