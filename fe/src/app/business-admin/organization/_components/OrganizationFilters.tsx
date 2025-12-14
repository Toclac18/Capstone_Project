// src/app/business-admin/organization/_components/OrganizationFilters.tsx
"use client";

import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import type { OrganizationQueryParams } from "../api";
import styles from "../styles.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING_EMAIL_VERIFY", label: "Pending Email Verify" },
  { value: "PENDING_APPROVE", label: "Pending Approve" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DELETED", label: "Deleted" },
] as const;

const SORT_OPTIONS = [
  { value: "organizationName", label: "Organization Name" },
  { value: "organizationEmail", label: "Email" },
  { value: "adminEmail", label: "Admin Email" },
  { value: "status", label: "Status" },
  { value: "createdAt", label: "Created Date" },
] as const;

const SORT_ORDER_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const;

type FilterValues = {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

interface OrganizationFiltersProps {
  onFiltersChange: (filters: OrganizationQueryParams) => void;
  loading?: boolean;
}

export function OrganizationFilters({
  onFiltersChange,
  loading = false,
}: OrganizationFiltersProps) {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { errors },
  } = useForm<FilterValues>({
    defaultValues: {
      search: "",
      status: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    },
  });

  const onSubmit: SubmitHandler<FilterValues> = (data: FilterValues) => {
    const filters: OrganizationQueryParams = {
      ...data,
      search: data.search?.trim() || "",
      page: 1,
    };
    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    reset();
    const clearedFilters: OrganizationQueryParams = {
      search: "",
      status: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
    };
    onFiltersChange(clearedFilters);
  };

  // Watch specific fields instead of entire form to avoid React Compiler warning
  const searchValue = useWatch({ control, name: "search" });
  const statusValue = useWatch({ control, name: "status" });
  const hasActiveFilters =
    searchValue ||
    statusValue;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles["filters-container"]}
    >
      {/* All Filters in One Row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[250px] max-w-[400px]">
          <label className={styles["label"]}>Search</label>
          <div className={styles["search-container"]}>
            <svg
              className={styles["search-icon"]}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="search"
              type="text"
              placeholder="Search by name, email, or admin email..."
              className={styles["search-input"]}
              disabled={loading}
              {...register("search")}
            />
          </div>
        </div>

        {/* Status */}
        <div className="w-[160px]">
          <label className={styles["label"]}>Status</label>
          <select
            id="status"
            className={`${styles["select"]} ${errors.status ? styles.error : ""}`}
            disabled={loading}
            {...register("status")}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="w-[180px]">
          <label className={styles["label"]}>Sort By</label>
          <select
            id="sortBy"
            className={`${styles["select"]} ${errors.sortBy ? styles.error : ""}`}
            disabled={loading}
            {...register("sortBy")}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Order */}
        <div className="w-[140px]">
          <label className={styles["label"]}>Order</label>
          <select
            id="sortOrder"
            className={`${styles["select"]} ${errors.sortOrder ? styles.error : ""}`}
            disabled={loading}
            {...register("sortOrder")}
          >
            {SORT_ORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="submit"
            disabled={loading}
            className={`${styles["btn"]} ${styles["btn-primary"]} min-w-[90px]`}
          >
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
            className={`${styles["btn"]} ${styles["btn-secondary"]} min-w-[80px]`}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Active filters:
            </span>
            {searchValue && (
              <span className={`${styles["filter-tag"]} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>
                Search: {searchValue}
                <button
                  type="button"
                  onClick={() => {
                    const currentValues = getValues();
                    const updatedFilters = { ...currentValues, search: "" };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            )}
            {statusValue && (
              <span className={`${styles["filter-tag"]} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}>
                Status: {STATUS_OPTIONS.find((s) => s.value === statusValue)?.label}
                <button
                  type="button"
                  onClick={() => {
                    const currentValues = getValues();
                    const updatedFilters = { ...currentValues, status: "" };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </form>
  );
}

