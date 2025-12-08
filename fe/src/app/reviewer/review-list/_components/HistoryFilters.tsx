"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, SubmitHandler, useWatch } from "react-hook-form";
import type { ReviewHistoryQueryParams } from "@/types/review";
import {
  getDocumentTypes,
  getDomains,
  type DocumentType,
  type Domain,
} from "@/services/upload-documents.service";
import styles from "../styles.module.css";

interface HistoryFiltersProps {
  onFiltersChange: (filters: ReviewHistoryQueryParams) => void;
  loading?: boolean;
}

type FilterValues = {
  search: string;
  dateFrom: string;
  dateTo: string;
  type: string;
  domain: string;
  approved: boolean;
  rejected: boolean;
};

export function HistoryFilters({
  onFiltersChange,
  loading = false,
}: HistoryFiltersProps) {
  const { register, handleSubmit, reset, control, watch } = useForm<FilterValues>({
    defaultValues: {
      search: "",
      dateFrom: "",
      dateTo: "",
      type: "",
      domain: "",
      approved: false,
      rejected: false,
    },
  });

  const watchedFilters = useWatch({ control });
  const dateFrom = watchedFilters.dateFrom;
  const dateTo = watchedFilters.dateTo;
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [types, domainsData] = await Promise.all([
          getDocumentTypes(),
          getDomains(),
        ]);
        setDocumentTypes(types);
        setDomains(domainsData);
      } catch (error) {
        console.error("Failed to load options:", error);
      }
    };
    loadOptions();
  }, []);

  const onSubmit = useCallback<SubmitHandler<FilterValues>>(
    (data: FilterValues) => {
      // Validate date range - dateTo must be greater than or equal to dateFrom
      if (data.dateFrom && data.dateTo && data.dateTo < data.dateFrom) {
        return; // Don't submit if validation fails
      }

      const filters: ReviewHistoryQueryParams = {
        search: data.search?.trim() || undefined,
        dateFrom: data.dateFrom || undefined,
        dateTo: data.dateTo || undefined,
        type: data.type || undefined,
        domain: data.domain || undefined,
        approved: data.approved || undefined,
        rejected: data.rejected || undefined,
        page: 1,
      };
      onFiltersChange(filters);
    },
    [onFiltersChange],
  );

  const handleClearFilters = useCallback(() => {
    reset({
      search: "",
      dateFrom: "",
      dateTo: "",
      type: "",
      domain: "",
      approved: false,
      rejected: false,
    });
    const clearedFilters: ReviewHistoryQueryParams = {
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      type: undefined,
      domain: undefined,
      approved: undefined,
      rejected: undefined,
      page: 1,
    };
    onFiltersChange(clearedFilters);
  }, [reset, onFiltersChange]);

  const hasActiveFilters =
    watchedFilters.search?.trim() ||
    watchedFilters.dateFrom ||
    watchedFilters.dateTo ||
    watchedFilters.type ||
    watchedFilters.domain ||
    watchedFilters.approved ||
    watchedFilters.rejected;

  const typeOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    map.set("", { value: "", label: "All Types" });
    documentTypes
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((t) => {
        if (!map.has(t.name)) {
          map.set(t.name, { value: t.name, label: t.name });
        }
      });
    return Array.from(map.values());
  }, [documentTypes]);

  const domainOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    map.set("", { value: "", label: "All Domains" });
    domains
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((d) => {
        if (!map.has(d.name)) {
          map.set(d.name, { value: d.name, label: d.name });
        }
      });
    return Array.from(map.values());
  }, [domains]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles["filters-container"]}
    >
      {/* Search Bar and Action Buttons */}
      <div className="mb-6 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
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
              placeholder="Search documents..."
              className={styles["search-input"]}
              disabled={loading}
              {...register("search")}
            />
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading || !hasActiveFilters}
            className={`${styles["btn"]} ${styles["btn-secondary"]} min-w-[100px]`}
          >
            Clear All
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`${styles["btn"]} ${styles["btn-primary"]} min-w-[100px]`}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Filter Grid */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="status" className={styles["label"]}>
            Status
          </label>
          <div className={styles["checkbox-group"]}>
            <label className={styles["checkbox-label"]}>
              <input
                id="approved"
                type="checkbox"
                {...register("approved")}
                className={styles["checkbox-input"]}
                disabled={loading}
              />
              <span className={styles["checkbox-text"]}>Approved</span>
            </label>
            <label className={styles["checkbox-label"]}>
              <input
                id="rejected"
                type="checkbox"
                {...register("rejected")}
                className={styles["checkbox-input"]}
                disabled={loading}
              />
              <span className={styles["checkbox-text"]}>Rejected</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="dateFrom" className={styles["label"]}>
            Date From
          </label>
          <input
            id="dateFrom"
            type="date"
            className={`${styles["input"]} ${dateFrom && dateTo && dateFrom > dateTo ? styles["input-error"] : ""}`}
            disabled={loading}
            max={dateTo || undefined}
            {...register("dateFrom", {
              validate: (value) => {
                if (dateTo && value && value > dateTo) {
                  return "Date From must be less than or equal to Date To";
                }
                return true;
              },
            })}
          />
          {dateFrom && dateTo && dateFrom > dateTo && (
            <p className={styles["field-error"]}>
              Date From must be less than or equal to Date To
            </p>
          )}
        </div>

        <div>
          <label htmlFor="dateTo" className={styles["label"]}>
            Date To
          </label>
          <input
            id="dateTo"
            type="date"
            className={`${styles["input"]} ${dateFrom && dateTo && dateTo < dateFrom ? styles["input-error"] : ""}`}
            disabled={loading}
            min={dateFrom || undefined}
            {...register("dateTo", {
              validate: (value) => {
                if (dateFrom && value && value < dateFrom) {
                  return "Date To must be greater than or equal to Date From";
                }
                return true;
              },
            })}
          />
          {dateFrom && dateTo && dateTo < dateFrom && (
            <p className={styles["field-error"]}>
              Date To must be greater than or equal to Date From
            </p>
          )}
        </div>

        <div>
          <label htmlFor="type" className={styles["label"]}>
            Type
          </label>
          <select
            id="type"
            className={styles["select"]}
            disabled={loading}
            {...register("type")}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="domain" className={styles["label"]}>
            Domain
          </label>
          <select
            id="domain"
            className={styles["select"]}
            disabled={loading}
            {...register("domain")}
          >
            {domainOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 border-t border-stroke pt-4 dark:border-stroke-dark">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-dark-6">Active filters:</span>
            {watchedFilters.search?.trim() && (
              <span
                className={`${styles["filter-tag"]} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}
              >
                Search: {watchedFilters.search}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters: FilterValues = {
                      search: "",
                      dateFrom: watchedFilters.dateFrom || "",
                      dateTo: watchedFilters.dateTo || "",
                      type: watchedFilters.type || "",
                      domain: watchedFilters.domain || "",
                      approved: watchedFilters.approved || false,
                      rejected: watchedFilters.rejected || false,
                    };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            )}
            {(watchedFilters.approved || watchedFilters.rejected) && (
              <span
                className={`${styles["filter-tag"]} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}
              >
                Status:{" "}
                {[
                  watchedFilters.approved && "Approved",
                  watchedFilters.rejected && "Rejected",
                ]
                  .filter(Boolean)
                  .join(", ")}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters: FilterValues = {
                      search: watchedFilters.search || "",
                      dateFrom: watchedFilters.dateFrom || "",
                      dateTo: watchedFilters.dateTo || "",
                      type: watchedFilters.type || "",
                      domain: watchedFilters.domain || "",
                      approved: false,
                      rejected: false,
                    };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.type && (
              <span
                className={`${styles["filter-tag"]} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}
              >
                Type: {watchedFilters.type}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters: FilterValues = {
                      search: watchedFilters.search || "",
                      dateFrom: watchedFilters.dateFrom || "",
                      dateTo: watchedFilters.dateTo || "",
                      type: "",
                      domain: watchedFilters.domain || "",
                      approved: watchedFilters.approved || false,
                      rejected: watchedFilters.rejected || false,
                    };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.domain && (
              <span
                className={`${styles["filter-tag"]} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}
              >
                Domain: {watchedFilters.domain}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters: FilterValues = {
                      search: watchedFilters.search || "",
                      dateFrom: watchedFilters.dateFrom || "",
                      dateTo: watchedFilters.dateTo || "",
                      type: watchedFilters.type || "",
                      domain: "",
                      approved: watchedFilters.approved || false,
                      rejected: watchedFilters.rejected || false,
                    };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                >
                  ×
                </button>
              </span>
            )}
            {(watchedFilters.dateFrom || watchedFilters.dateTo) && (
              <span
                className={`${styles["filter-tag"]} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`}
              >
                Date: {watchedFilters.dateFrom || "Start"} -{" "}
                {watchedFilters.dateTo || "End"}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters: FilterValues = {
                      search: watchedFilters.search || "",
                      dateFrom: "",
                      dateTo: "",
                      type: watchedFilters.type || "",
                      domain: watchedFilters.domain || "",
                      approved: watchedFilters.approved || false,
                      rejected: watchedFilters.rejected || false,
                    };
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
