// src/app/business-admin/users/_components/UserFilters.tsx
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import type { UserQueryParams } from "../api";
import styles from "../styles.module.css";

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "READER", label: "Reader" },
  { value: "REVIEWER", label: "Reviewer" },
  { value: "ORGANIZATION_ADMIN", label: "Organization Admin" },
] as const;

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING_VERIFICATION", label: "Pending Verification" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DELETED", label: "Deleted" },
  { value: "DEACTIVE", label: "Deactive" },
] as const;

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "role", label: "Role" },
  { value: "status", label: "Status" },
  { value: "createdAt", label: "Created Date" },
] as const;

const SORT_ORDER_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const;

type FilterValues = {
  search: string;
  role: string;
  status: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  dateFrom: string;
  dateTo: string;
};

interface UserFiltersProps {
  onFiltersChange: (filters: UserQueryParams) => void;
  loading?: boolean;
}

export function UserFilters({
  onFiltersChange,
  loading = false,
}: UserFiltersProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FilterValues>({
    defaultValues: {
      search: "",
      role: "",
      status: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      dateFrom: "",
      dateTo: "",
    },
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const onSubmit: SubmitHandler<FilterValues> = (data: FilterValues) => {
    const filters: UserQueryParams = {
      ...data,
      page: 1,
    };
    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    reset();
    const clearedFilters: UserQueryParams = {
      search: "",
      role: "",
      status: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      dateFrom: "",
      dateTo: "",
      page: 1,
    };
    onFiltersChange(clearedFilters);
  };

  const watchedFilters = watch();
  const hasActiveFilters =
    watchedFilters.search ||
    watchedFilters.role ||
    watchedFilters.status ||
    watchedFilters.dateFrom ||
    watchedFilters.dateTo;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles["filters-container"]}
    >
      {/* Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="w-full lg:w-auto lg:min-w-[300px] lg:max-w-[400px]">
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
              placeholder="Search by name or email..."
              className={styles["search-input"]}
              disabled={loading}
              {...register("search")}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className={`${styles["btn"]} ${styles["btn-primary"]}`}
          >
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
            className={`${styles["btn"]} ${styles["btn-secondary"]}`}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="min-w-[150px]">
          <label className={styles["label"]}>Role</label>
          <select
            id="role"
            className={`${styles["select"]} ${errors.role ? styles.error : ""}`}
            disabled={loading}
            {...register("role")}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px]">
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

        <div className="min-w-[150px]">
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

        <div className="min-w-[150px]">
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
      </div>

      {/* Advanced Filters Toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={styles["advanced-toggle"]}
        >
          {showAdvanced ? "Hide" : "Show"} Advanced Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Date Range Filter
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[150px]">
              <label htmlFor="dateFrom" className={styles["label"]}>
                From Date
              </label>
              <input
                id="dateFrom"
                type="date"
                className={`${styles["input"]} ${errors.dateFrom ? styles.error : ""}`}
                disabled={loading}
                {...register("dateFrom")}
              />
            </div>

            <div className="min-w-[150px]">
              <label htmlFor="dateTo" className={styles["label"]}>
                To Date
              </label>
              <input
                id="dateTo"
                type="date"
                className={`${styles["input"]} ${errors.dateTo ? styles.error : ""}`}
                disabled={loading}
                {...register("dateTo")}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Active filters:
            </span>
          {watchedFilters.search && (
            <span className={`${styles["filter-tag"]} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>
              Search: {watchedFilters.search}
              <button
                type="button"
                onClick={() => {
                  const updatedFilters = { ...watchedFilters, search: "" };
                  reset(updatedFilters);
                  onSubmit(updatedFilters);
                }}
                className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                ×
              </button>
            </span>
          )}
          {watchedFilters.role && (
            <span className={`${styles["filter-tag"]} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>
              Role: {ROLE_OPTIONS.find((r) => r.value === watchedFilters.role)?.label}
              <button
                type="button"
                onClick={() => {
                  const updatedFilters = { ...watchedFilters, role: "" };
                  reset(updatedFilters);
                  onSubmit(updatedFilters);
                }}
                className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              >
                ×
              </button>
            </span>
          )}
          {watchedFilters.status && (
            <span className={`${styles["filter-tag"]} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}>
              Status: {STATUS_OPTIONS.find((s) => s.value === watchedFilters.status)?.label}
              <button
                type="button"
                onClick={() => {
                  const updatedFilters = { ...watchedFilters, status: "" };
                  reset(updatedFilters);
                  onSubmit(updatedFilters);
                }}
                className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
              >
                ×
              </button>
            </span>
          )}
          {(watchedFilters.dateFrom || watchedFilters.dateTo) && (
            <span className={`${styles["filter-tag"]} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`}>
              Date: {watchedFilters.dateFrom || "Start"} - {watchedFilters.dateTo || "End"}
              <button
                type="button"
                onClick={() => {
                  const updatedFilters = { ...watchedFilters, dateFrom: "", dateTo: "" };
                  reset(updatedFilters);
                  onSubmit(updatedFilters);
                }}
                className="ml-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
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


