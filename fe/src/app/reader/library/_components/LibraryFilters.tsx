"use client";

import { useForm, type SubmitHandler, useWatch } from "react-hook-form";
import { X, Search } from "lucide-react";
import styles from "../styles.module.css";
import type { LibraryQueryParams } from "../api";

interface LibraryFiltersProps {
  onFiltersChange: (filters: LibraryQueryParams) => void;
  loading?: boolean;
  documentTypes: string[];
  domains: string[];
}

type FilterValues = {
  search: string;
  uploaded: boolean;
  redeemed: boolean;
  dateFrom: string;
  dateTo: string;
  type: string;
  domain: string;
};

export function LibraryFilters({
  onFiltersChange,
  loading = false,
  documentTypes,
  domains,
}: LibraryFiltersProps) {
  const { register, handleSubmit, reset, control } = useForm<FilterValues>({
    defaultValues: {
      search: "",
      uploaded: false,
      redeemed: false,
      dateFrom: "",
      dateTo: "",
      type: "",
      domain: "",
    },
  });

  const watchedFilters = useWatch({ control });

  const onSubmit: SubmitHandler<FilterValues> = (data: FilterValues) => {
    // Determine source: if both checked, no filter (show all). If only one checked, use that.
    let source: "UPLOADED" | "REDEEMED" | undefined = undefined;
    if (data.uploaded && !data.redeemed) {
      source = "UPLOADED";
    } else if (!data.uploaded && data.redeemed) {
      source = "REDEEMED";
    }
    // If both are checked or both are unchecked, source remains undefined (show all)

    const filters: LibraryQueryParams = {
      search: data.search?.trim() || undefined,
      source,
      dateFrom: data.dateFrom || undefined,
      dateTo: data.dateTo || undefined,
      type: data.type || undefined,
      domain: data.domain || undefined,
      page: 1,
    };
    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    reset();
    const clearedFilters: LibraryQueryParams = {
      search: undefined,
      source: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      type: undefined,
      domain: undefined,
      page: 1,
    };
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters =
    watchedFilters.search?.trim() ||
    watchedFilters.uploaded ||
    watchedFilters.redeemed ||
    watchedFilters.dateFrom ||
    watchedFilters.dateTo ||
    watchedFilters.type ||
    watchedFilters.domain;

  const typeOptions = [
    { value: "", label: "All Types" },
    ...Array.from(new Set(documentTypes))
      .filter(Boolean)
      .sort()
      .map((t) => ({ value: t, label: t })),
  ];

  const domainOptions = [
    { value: "", label: "All Domains" },
    ...Array.from(new Set(domains))
      .filter(Boolean)
      .sort()
      .map((d) => ({ value: d, label: d })),
  ];

  return (
    <div className={styles["filters-container"]}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles["filters-form"]}
      >
        {/* Search Bar and Actions */}
        <div className={styles["search-actions-row"]}>
          <div className={styles["search-wrapper"]}>
            <Search className={styles["search-icon"]} />
            <input
              type="text"
              placeholder="Search documents..."
              {...register("search")}
              className={styles["search-input"]}
              disabled={loading}
            />
          </div>
          <div className={styles["filters-actions"]}>
            <button
              type="button"
              onClick={handleClearFilters}
              className={styles["btn-clear-filters"]}
              disabled={loading || !hasActiveFilters}
            >
              Clear All
            </button>
            <button
              type="submit"
              className={styles["btn-apply-filters"]}
              disabled={loading}
            >
              Apply Filters
            </button>
          </div>
        </div>

        <div className={styles["filters-grid"]}>
          {/* Source Filter - Checkboxes */}
          <div className={styles["filter-group"]}>
            <label className={styles["filter-label"]}>Source</label>
            <div className={styles["checkbox-group"]}>
              <label className={styles["checkbox-label"]}>
                <input
                  type="checkbox"
                  {...register("uploaded")}
                  className={styles["checkbox-input"]}
                  disabled={loading}
                />
                <span className={styles["checkbox-text"]}>Uploaded</span>
              </label>
              <label className={styles["checkbox-label"]}>
                <input
                  type="checkbox"
                  {...register("redeemed")}
                  className={styles["checkbox-input"]}
                  disabled={loading}
                />
                <span className={styles["checkbox-text"]}>Redeemed</span>
              </label>
            </div>
          </div>

          {/* Date From */}
          <div className={styles["filter-group"]}>
            <label className={styles["filter-label"]}>Date From</label>
            <input
              type="date"
              {...register("dateFrom")}
              className={styles["filter-input"]}
              disabled={loading}
            />
          </div>

          {/* Date To */}
          <div className={styles["filter-group"]}>
            <label className={styles["filter-label"]}>Date To</label>
            <input
              type="date"
              {...register("dateTo")}
              className={styles["filter-input"]}
              disabled={loading}
            />
          </div>

          {/* Type Filter */}
          <div className={styles["filter-group"]}>
            <label className={styles["filter-label"]}>Type</label>
            <select
              {...register("type")}
              className={styles["filter-select"]}
              disabled={loading}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Domain Filter */}
          <div className={styles["filter-group"]}>
            <label className={styles["filter-label"]}>Domain</label>
            <select
              {...register("domain")}
              className={styles["filter-select"]}
              disabled={loading}
            >
              {domainOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className={styles["active-filters"]}>
            <div className={styles["active-filters-header"]}>
              <span className={styles["active-filters-title"]}>
                Active Filters:
              </span>
            </div>
            <div className={styles["active-filters-tags"]}>
              {watchedFilters.search?.trim() && (
                <span
                  className={`${styles["filter-tag"]} ${styles["filter-tag-search"]}`}
                >
                  Search: {watchedFilters.search}
                  <button
                    type="button"
                    onClick={() => {
                      const updatedFilters: FilterValues = {
                        search: "",
                        uploaded: watchedFilters.uploaded || false,
                        redeemed: watchedFilters.redeemed || false,
                        dateFrom: watchedFilters.dateFrom || "",
                        dateTo: watchedFilters.dateTo || "",
                        type: watchedFilters.type || "",
                        domain: watchedFilters.domain || "",
                      };
                      reset(updatedFilters);
                    }}
                    className={`${styles["filter-tag-remove"]} ${styles["filter-tag-remove-search"]}`}
                  >
                    <X className={styles["filter-tag-icon"]} />
                  </button>
                </span>
              )}
              {(watchedFilters.uploaded || watchedFilters.redeemed) && (
                <span
                  className={`${styles["filter-tag"]} ${styles["filter-tag-source"]}`}
                >
                  Source:{" "}
                  {[
                    watchedFilters.uploaded && "Uploaded",
                    watchedFilters.redeemed && "Redeemed",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                  <button
                    type="button"
                    onClick={() => {
                      reset({
                        ...watchedFilters,
                        uploaded: false,
                        redeemed: false,
                      });
                    }}
                    className={`${styles["filter-tag-remove"]} ${styles["filter-tag-remove-source"]}`}
                  >
                    <X className={styles["filter-tag-icon"]} />
                  </button>
                </span>
              )}
              {watchedFilters.dateFrom && (
                <span
                  className={`${styles["filter-tag"]} ${styles["filter-tag-date"]}`}
                >
                  From: {new Date(watchedFilters.dateFrom).toLocaleDateString()}
                  <button
                    type="button"
                    onClick={() => {
                      const updatedFilters: FilterValues = {
                        search: watchedFilters.search || "",
                        uploaded: watchedFilters.uploaded || false,
                        redeemed: watchedFilters.redeemed || false,
                        dateFrom: "",
                        dateTo: watchedFilters.dateTo || "",
                        type: watchedFilters.type || "",
                        domain: watchedFilters.domain || "",
                      };
                      reset(updatedFilters);
                    }}
                    className={`${styles["filter-tag-remove"]} ${styles["filter-tag-remove-date"]}`}
                  >
                    <X className={styles["filter-tag-icon"]} />
                  </button>
                </span>
              )}
              {watchedFilters.dateTo && (
                <span
                  className={`${styles["filter-tag"]} ${styles["filter-tag-date"]}`}
                >
                  To: {new Date(watchedFilters.dateTo).toLocaleDateString()}
                  <button
                    type="button"
                    onClick={() => {
                      const updatedFilters: FilterValues = {
                        search: watchedFilters.search || "",
                        uploaded: watchedFilters.uploaded || false,
                        redeemed: watchedFilters.redeemed || false,
                        dateFrom: watchedFilters.dateFrom || "",
                        dateTo: "",
                        type: watchedFilters.type || "",
                        domain: watchedFilters.domain || "",
                      };
                      reset(updatedFilters);
                    }}
                    className={`${styles["filter-tag-remove"]} ${styles["filter-tag-remove-date"]}`}
                  >
                    <X className={styles["filter-tag-icon"]} />
                  </button>
                </span>
              )}
              {watchedFilters.type && (
                <span
                  className={`${styles["filter-tag"]} ${styles["filter-tag-type"]}`}
                >
                  Type: {watchedFilters.type}
                  <button
                    type="button"
                    onClick={() => {
                      const updatedFilters: FilterValues = {
                        search: watchedFilters.search || "",
                        uploaded: watchedFilters.uploaded || false,
                        redeemed: watchedFilters.redeemed || false,
                        dateFrom: watchedFilters.dateFrom || "",
                        dateTo: watchedFilters.dateTo || "",
                        type: "",
                        domain: watchedFilters.domain || "",
                      };
                      reset(updatedFilters);
                    }}
                    className={`${styles["filter-tag-remove"]} ${styles["filter-tag-remove-type"]}`}
                  >
                    <X className={styles["filter-tag-icon"]} />
                  </button>
                </span>
              )}
              {watchedFilters.domain && (
                <span
                  className={`${styles["filter-tag"]} ${styles["filter-tag-domain"]}`}
                >
                  Domain: {watchedFilters.domain}
                  <button
                    type="button"
                    onClick={() => {
                      const updatedFilters: FilterValues = {
                        search: watchedFilters.search || "",
                        uploaded: watchedFilters.uploaded || false,
                        redeemed: watchedFilters.redeemed || false,
                        dateFrom: watchedFilters.dateFrom || "",
                        dateTo: watchedFilters.dateTo || "",
                        type: watchedFilters.type || "",
                        domain: "",
                      };
                      reset(updatedFilters);
                    }}
                    className={`${styles["filter-tag-remove"]} ${styles["filter-tag-remove-domain"]}`}
                  >
                    <X className={styles["filter-tag-icon"]} />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
