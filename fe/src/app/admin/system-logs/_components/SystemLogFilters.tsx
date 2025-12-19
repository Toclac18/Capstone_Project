// src/app/admin/system-logs/_components/SystemLogFilters.tsx
"use client";

import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import type { SystemLogQueryParams } from "@/types/system-log";
import { useToast, toast } from "@/components/ui/toast";
import styles from "../styles.module.css";

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "USER_LOGIN_SUCCESS", label: "Login Success" },
  { value: "USER_LOGIN_FAILED", label: "Login Failed" },
  { value: "USER_LOGOUT", label: "Logout" },
  { value: "PASSWORD_CHANGED", label: "Password Changed" },
  { value: "EMAIL_CHANGED", label: "Email Changed" },
  { value: "ROLE_CHANGED", label: "Role Changed" },
  { value: "USER_STATUS_CHANGED", label: "User Status Changed" },
  { value: "SYSTEM_CONFIG_UPDATED", label: "Config Updated" },
  { value: "DOCUMENT_UPLOADED", label: "Document Uploaded" },
  { value: "DOCUMENT_DELETED", label: "Document Deleted" },
  { value: "REVIEWER_APPROVED", label: "Reviewer Approved" },
  { value: "ORGANIZATION_APPROVED", label: "Organization Approved" },
] as const;

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "SYSTEM_ADMIN", label: "System Admin" },
  { value: "BUSINESS_ADMIN", label: "Business Admin" },
  { value: "ORGANIZATION_ADMIN", label: "Organization Admin" },
  { value: "REVIEWER", label: "Reviewer" },
  { value: "READER", label: "Reader" },
] as const;

type FilterValues = {
  search: string;
  action: string;
  userRole: string;
  ipAddress: string;
  dateFrom: string;
  dateTo: string;
};

interface SystemLogFiltersProps {
  onFiltersChange: (filters: SystemLogQueryParams) => void;
  loading?: boolean;
}

export function SystemLogFilters({
  onFiltersChange,
  loading = false,
}: SystemLogFiltersProps) {
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FilterValues>({
    defaultValues: {
      search: "",
      action: "",
      userRole: "",
      ipAddress: "",
      dateFrom: "",
      dateTo: "",
    },
  });

  const onSubmit: SubmitHandler<FilterValues> = (data: FilterValues) => {
    // Validate date range (datetime-local format)
    if (data.dateFrom && data.dateTo) {
      const fromDate = new Date(data.dateFrom);
      const toDate = new Date(data.dateTo);
      if (fromDate > toDate) {
        showToast(toast.error("Validation Error", "Date From must be before or equal to Date To"));
        return;
      }
    }
    
    const filters: SystemLogQueryParams = {
      ...data,
      action: data.action || undefined,
      userRole: data.userRole || undefined,
      ipAddress: data.ipAddress?.trim() || undefined,
      startDate: data.dateFrom || undefined,
      endDate: data.dateTo || undefined,
      search: data.search?.trim() || undefined,
      page: 1,
    };
    onFiltersChange(filters);
  };

  // Helper function to remove a single filter
  const removeFilter = (fieldName: keyof FilterValues, value: string = "") => {
    const updatedFilters = { ...watchedFilters, [fieldName]: value };
    reset(updatedFilters);
    // Convert to SystemLogQueryParams and submit
    const filters: SystemLogQueryParams = {
      ...updatedFilters,
      action: updatedFilters.action || undefined,
      userRole: updatedFilters.userRole || undefined,
      ipAddress: updatedFilters.ipAddress || undefined,
      startDate: updatedFilters.dateFrom || undefined,
      endDate: updatedFilters.dateTo || undefined,
      search: updatedFilters.search || undefined,
      page: 1,
    };
    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    reset();
    const clearedFilters: SystemLogQueryParams = {
      search: undefined,
      action: undefined,
      userRole: undefined,
      ipAddress: undefined,
      startDate: undefined,
      endDate: undefined,
      page: 1,
    };
    onFiltersChange(clearedFilters);
  };

  // Use `useWatch` to subscribe to specific form field values; this avoids
  // consuming the full `watch()` API which some lint rules flag as incompatible.
  const [
    watchedSearch,
    watchedAction,
    watchedUserRole,
    watchedIpAddress,
    watchedDateFrom,
    watchedDateTo,
  ] = useWatch({
    control,
    name: [
      "search",
      "action",
      "userRole",
      "ipAddress",
      "dateFrom",
      "dateTo",
    ] as const,
  }) as unknown as [
    string | undefined,
    string | undefined,
    string | undefined,
    string | undefined,
    string | undefined,
    string | undefined,
  ];

  const watchedFilters = {
    search: watchedSearch,
    action: watchedAction,
    userRole: watchedUserRole,
    ipAddress: watchedIpAddress,
    dateFrom: watchedDateFrom,
    dateTo: watchedDateTo,
  };

  const hasActiveFilters =
    watchedFilters.search ||
    watchedFilters.action ||
    watchedFilters.userRole ||
    watchedFilters.ipAddress ||
    watchedFilters.dateFrom ||
    watchedFilters.dateTo;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles["filters-container"]}
    >
      {/* Search Bar */}
      <div className="mb-4 flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-auto lg:min-w-[500px] lg:max-w-[800px]">
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
              placeholder="Search by action, details, IP address, or user agent..."
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

      {/* Filters Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Action Filter */}
        <div className={styles["field-group"]}>
          <label htmlFor="action" className={styles["label"]}>
            Action
          </label>
          <select
            id="action"
            className={`${styles["select"]} ${errors.action ? styles.error : ""}`}
            disabled={loading}
            {...register("action")}
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* User Role Filter */}
        <div className={styles["field-group"]}>
          <label htmlFor="userRole" className={styles["label"]}>
            User Role
          </label>
          <select
            id="userRole"
            className={`${styles["select"]} ${errors.userRole ? styles.error : ""}`}
            disabled={loading}
            {...register("userRole")}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* IP Address Filter */}
        <div className={styles["field-group"]}>
          <label htmlFor="ipAddress" className={styles["label"]}>
            IP Address
          </label>
          <input
            id="ipAddress"
            type="text"
            placeholder="e.g., 192.168.1.1"
            className={`${styles["input"]} ${errors.ipAddress ? styles.error : ""}`}
            disabled={loading}
            {...register("ipAddress")}
          />
        </div>

        {/* Date From */}
        <div className={styles["field-group"]}>
          <label htmlFor="dateFrom" className={styles["label"]}>
            Date From
          </label>
          <input
            id="dateFrom"
            type="datetime-local"
            className={`${styles["input"]} ${errors.dateFrom ? styles.error : ""}`}
            disabled={loading}
            {...register("dateFrom")}
          />
        </div>

        {/* Date To */}
        <div className={styles["field-group"]}>
          <label htmlFor="dateTo" className={styles["label"]}>
            Date To
          </label>
          <input
            id="dateTo"
            type="datetime-local"
            className={`${styles["input"]} ${errors.dateTo ? styles.error : ""}`}
            disabled={loading}
            {...register("dateTo")}
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Active filters:
            </span>
            {watchedFilters.search && (
              <span
                className={`${styles["filter-tag"]} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}
              >
                Search: {watchedFilters.search}
                <button
                  type="button"
                  onClick={() => removeFilter("search")}
                  className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.action && (
              <span
                className={`${styles["filter-tag"]} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}
              >
                Action:{" "}
                {
                  ACTION_OPTIONS.find((o) => o.value === watchedFilters.action)
                    ?.label
                }
                <button
                  type="button"
                  onClick={() => removeFilter("action")}
                  className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.userRole && (
              <span
                className={`${styles["filter-tag"]} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}
              >
                Role:{" "}
                {
                  ROLE_OPTIONS.find((o) => o.value === watchedFilters.userRole)
                    ?.label
                }
                <button
                  type="button"
                  onClick={() => removeFilter("userRole")}
                  className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.ipAddress && (
              <span
                className={`${styles["filter-tag"]} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}
              >
                IP: {watchedFilters.ipAddress}
                <button
                  type="button"
                  onClick={() => removeFilter("ipAddress")}
                  className="ml-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                >
                  ×
                </button>
              </span>
            )}
            {(watchedFilters.dateFrom || watchedFilters.dateTo) && (
              <span
                className={`${styles["filter-tag"]} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`}
              >
                Date:{" "}
                {watchedFilters.dateFrom
                  ? new Date(watchedFilters.dateFrom).toLocaleDateString()
                  : "Start"}{" "}
                -{" "}
                {watchedFilters.dateTo
                  ? new Date(watchedFilters.dateTo).toLocaleDateString()
                  : "End"}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = {
                      ...watchedFilters,
                      dateFrom: "",
                      dateTo: "",
                    };
                    reset(updatedFilters);
                    const filters: SystemLogQueryParams = {
                      ...updatedFilters,
                      action: updatedFilters.action || undefined,
                      userRole: updatedFilters.userRole || undefined,
                      ipAddress: updatedFilters.ipAddress || undefined,
                      startDate: undefined,
                      endDate: undefined,
                      search: updatedFilters.search || undefined,
                      page: 1,
                    };
                    onFiltersChange(filters);
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
