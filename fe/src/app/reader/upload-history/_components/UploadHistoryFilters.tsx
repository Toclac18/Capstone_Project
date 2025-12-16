"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler, useWatch } from "react-hook-form";
import type { UploadHistoryQueryParams, DocumentHistoryStatus } from "../api";
import { getDocumentTypes, getDomains, type DocumentType, type Domain } from "@/services/upload-documents.service";
import styles from "../styles.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
] as const;

type FilterValues = {
  search: string;
  dateFrom: string;
  dateTo: string;
  type: string;
  domain: string;
  status: string;
};

interface UploadHistoryFiltersProps {
  onFiltersChange: (filters: UploadHistoryQueryParams) => void;
  loading?: boolean;
}

export function UploadHistoryFilters({
  onFiltersChange,
  loading = false,
}: UploadHistoryFiltersProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    control,
    getValues,
  } = useForm<FilterValues>({
    defaultValues: {
      search: "",
      dateFrom: "",
      dateTo: "",
      type: "",
      domain: "",
      status: "",
    },
  });

  const watchedFilters = useWatch({ control });
  const dateFromValue = useWatch({ control, name: "dateFrom" });
  const dateToValue = useWatch({ control, name: "dateTo" });

  // Fetch document types and domains on mount
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [typesData, domainsData] = await Promise.all([
          getDocumentTypes(),
          getDomains(),
        ]);
        setDocumentTypes(typesData);
        setDomains(domainsData);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  // Note: Filters are applied on form submit or individual field change
  // Auto-apply is disabled to allow users to set multiple filters before applying

  const onSubmit: SubmitHandler<FilterValues> = (data: FilterValues) => {
    const filters: UploadHistoryQueryParams = {
      search: data.search?.trim() || undefined,
      dateFrom: data.dateFrom || undefined,
      dateTo: data.dateTo || undefined,
      type: data.type || undefined,
      domain: data.domain || undefined,
      status: (data.status || undefined) as DocumentHistoryStatus | undefined,
      page: 1,
    };
    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    reset();
    const clearedFilters: UploadHistoryQueryParams = {
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      type: undefined,
      domain: undefined,
      status: undefined,
      page: 1,
    };
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters =
    watchedFilters.search ||
    watchedFilters.dateFrom ||
    watchedFilters.dateTo ||
    watchedFilters.type ||
    watchedFilters.domain ||
    watchedFilters.status;

  const typeOptions = useMemo(() => {
    const options = [{ value: "", label: "All Types" }];
    documentTypes.forEach((type) => {
      if (type.id && type.name) {
        options.push({ value: type.id, label: type.name });
      }
    });
    return options;
  }, [documentTypes]);

  const domainOptions = useMemo(() => {
    const options = [{ value: "", label: "All Domains" }];
    domains.forEach((domain) => {
      if (domain.id && domain.name) {
        options.push({ value: domain.id, label: domain.name });
      }
    });
    return options;
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
              placeholder="Search by document name..."
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
          <label htmlFor="dateFrom" className={styles["label"]}>
            Date From
          </label>
          <input
            id="dateFrom"
            type="date"
            className={`${styles["input"]} ${errors.dateFrom ? styles.error : ""}`}
            disabled={loading}
            max={dateToValue || undefined}
            {...register("dateFrom", {
              validate: (value) => {
                const dateToValue = getValues("dateTo");
                if (value && dateToValue) {
                  const fromDate = new Date(value);
                  const toDate = new Date(dateToValue);
                  if (fromDate > toDate) {
                    return "Date From must be less than or equal to Date To";
                  }
                }
                return true;
              },
            })}
          />
          {errors.dateFrom && (
            <p className="mt-1 text-sm text-red-500">{errors.dateFrom.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="dateTo" className={styles["label"]}>
            Date To
          </label>
          <input
            id="dateTo"
            type="date"
            className={`${styles["input"]} ${errors.dateTo ? styles.error : ""}`}
            disabled={loading}
            min={dateFromValue || undefined}
            {...register("dateTo", {
              validate: (value) => {
                const dateFromValue = getValues("dateFrom");
                if (value && dateFromValue) {
                  const fromDate = new Date(dateFromValue);
                  const toDate = new Date(value);
                  if (fromDate > toDate) {
                    return "Date To must be greater than or equal to Date From";
                  }
                }
                return true;
              },
            })}
          />
          {errors.dateTo && (
            <p className="mt-1 text-sm text-red-500">{errors.dateTo.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="type" className={styles["label"]}>
            Type
          </label>
          <select
            id="type"
            className={`${styles["select"]} ${errors.type ? styles.error : ""}`}
            disabled={loading || loadingOptions}
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
            className={`${styles["select"]} ${errors.domain ? styles.error : ""}`}
            disabled={loading || loadingOptions}
            {...register("domain")}
          >
            {domainOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className={styles["label"]}>
            Status
          </label>
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
                  onClick={() => {
                    const updatedFilters = {
                      ...watchedFilters,
                      search: "",
                    } as FilterValues;
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.status && (
              <span
                className={`${styles["filter-tag"]} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}
              >
                Status:{" "}
                {
                  STATUS_OPTIONS.find((s) => s.value === watchedFilters.status)
                    ?.label
                }
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = {
                      ...watchedFilters,
                      status: "",
                    } as FilterValues;
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
                Type:{" "}
                {typeOptions.find((t) => t.value === watchedFilters.type)
                  ?.label ?? watchedFilters.type}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = {
                      ...watchedFilters,
                      type: "",
                    } as FilterValues;
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
                Domain:{" "}
                {domainOptions.find((d) => d.value === watchedFilters.domain)
                  ?.label ?? watchedFilters.domain}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = {
                      ...watchedFilters,
                      domain: "",
                    } as FilterValues;
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
                    const updatedFilters = {
                      ...watchedFilters,
                      dateFrom: "",
                      dateTo: "",
                    } as FilterValues;
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
