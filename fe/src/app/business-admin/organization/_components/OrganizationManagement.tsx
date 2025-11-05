// src/app/business-admin/organization/_components/OrganizationManagement.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import type {
  Organization,
  OrganizationResponse,
  OrganizationQueryParams,
} from "../api";
// TODO: When backend is ready, uncomment these imports:
// import {
//   getOrganizations,
//   updateOrganizationStatus,
//   deleteOrganization,
// } from "../api";
import { OrganizationFilters } from "./OrganizationFilters";
import { Pagination } from "@/app/business-admin/users/_components/Pagination";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import { Eye } from "lucide-react";
import styles from "../styles.module.css";

// TODO: Remove this fake data when backend is ready
// Fake data tạm thời - Remove when switching to API
const generateFakeOrganizations = (): Organization[] => {
  const names = [
    "Tech Solutions Inc",
    "Digital Innovations Ltd",
    "Global Enterprises Corp",
    "Smart Systems Group",
    "Future Technologies LLC",
    "Innovation Hub Co",
    "Creative Minds Agency",
    "Premium Services Ltd",
    "Advanced Solutions Inc",
    "Excellence Corporation",
    "Prime Business Group",
    "Modern Systems Ltd",
    "Elite Technologies Co",
    "Professional Services Inc",
    "Strategic Solutions Corp",
    "Dynamic Enterprises LLC",
    "Visionary Systems Group",
    "Prime Innovation Co",
    "Advanced Business Ltd",
    "Excellence Technologies Inc",
    "Tech Corp Solutions",
    "Digital World Inc",
    "Global Tech Ltd",
    "Smart Digital Co",
    "Future Systems LLC",
  ];

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return names.map((name, i) => {
    const email = name.toLowerCase().replace(/\s+/g, "-") + "@example.com";
    const hotline = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    const adminEmail = `admin.${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
    const status: string = Math.random() > 0.3 ? "ACTIVE" : "INACTIVE";
    const active = status === "ACTIVE";
    const daysAgo = Math.floor(Math.random() * 180);
    const createdAt = new Date(now - daysAgo * oneDayMs).toISOString();

    return {
      id: `org-${String(i + 1).padStart(3, "0")}`,
      organizationName: name, // For display
      email,
      hotline,
      logo: i % 3 === 0 ? `https://via.placeholder.com/64?text=${name.substring(0, 2).toUpperCase()}` : undefined,
      address: `${i + 1} ${name} Street, City, Country`,
      status,
      adminName: `Admin ${name}`,
      adminEmail,
      active,
      deleted: false,
      createdAt,
      updatedAt: createdAt,
    };
  });
};

// Fake data store trong component
const FAKE_ORGANIZATIONS = generateFakeOrganizations();

export function OrganizationManagement() {
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>(FAKE_ORGANIZATIONS);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [filters, setFilters] = useState<OrganizationQueryParams>({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Filter và paginate fake data
  const filteredAndPaginated = useMemo(() => {
    let filtered = [...allOrganizations];

    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          (org.organizationName || org.email).toLowerCase().includes(searchLower) ||
          org.email.toLowerCase().includes(searchLower) ||
          org.hotline.toLowerCase().includes(searchLower) ||
          org.adminEmail.toLowerCase().includes(searchLower) ||
          (org.address && org.address.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((org) => org.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      filtered = filtered.filter((org) => {
        if (!org.createdAt) return false;
        return new Date(org.createdAt) >= dateFrom;
      });
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      filtered = filtered.filter((org) => {
        if (!org.createdAt) return false;
        return new Date(org.createdAt) <= dateTo;
      });
    }

    // Sort
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Organization] || "";
      let bValue: any = b[sortBy as keyof Organization] || "";

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // Pagination
    const page = filters.page || 1;
    const limit = itemsPerPage;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      organizations: paginated,
      total: filtered.length,
      page,
    };
  }, [allOrganizations, filters, itemsPerPage]);

  // TODO: Replace this with API call when backend is ready
  // Fetch organizations với fake data - Replace with getOrganizations() API call
  const fetchOrganizations = async (queryParams: OrganizationQueryParams) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      setFilters(queryParams);
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
  };

  // Update organizations khi filters thay đổi
  useEffect(() => {
    setOrganizations(filteredAndPaginated.organizations);
    setTotalItems(filteredAndPaginated.total);
    setCurrentPage(filteredAndPaginated.page);
  }, [filteredAndPaginated]);

  // Initial load
  useEffect(() => {
    fetchOrganizations(filters);
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

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      // Delete from fake data
      setAllOrganizations((prev) => prev.filter((org) => org.id !== String(orgId)));
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
                      {org.logo ? (
                        <img
                          src={org.logo}
                          alt={org.organizationName || org.email}
                          className={styles["logo"]}
                        />
                      ) : (
                        <div className={styles["logo-placeholder"]}>
                          <span className={styles["logo-text"]}>
                            {(org.organizationName || org.email)
                              .substring(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className={styles["table-cell"]}>
                      <div className={styles["table-cell-main"]}>
                        {org.organizationName || org.email}
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
                          itemName={org.organizationName || org.email}
                          title="Delete Organization"
                          description={`Are you sure you want to delete "${org.organizationName || org.email}"?`}
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

