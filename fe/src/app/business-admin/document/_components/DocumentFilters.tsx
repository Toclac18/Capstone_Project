// src/app/business-admin/document/_components/DocumentFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import type { DocumentQueryParams } from "../api";
import { apiClient } from "@/services/http";
import type { Organization } from "@/types/organization";
import { useClickOutside } from "@/hooks/use-click-outside";
import styles from "../styles.module.css";

const SORT_OPTIONS = [
  { value: "title", label: "Title" },
  { value: "viewCount", label: "View Count" },
  { value: "createdAt", label: "Created Date" },
] as const;

const SORT_ORDER_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
] as const;

type FilterValues = {
  search: string;
  organizationId: string;
  typeId: string;
  isPublic: string;
  isPremium: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  dateFrom: string;
  dateTo: string;
};

interface DocumentFiltersProps {
  onFiltersChange: (filters: DocumentQueryParams) => void;
  loading?: boolean;
}

export function DocumentFilters({
  onFiltersChange,
  loading = false,
}: DocumentFiltersProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgSearch, setOrgSearch] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FilterValues>({
    defaultValues: {
      search: "",
      organizationId: "",
      typeId: "",
      isPublic: "",
      isPremium: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      dateFrom: "",
      dateTo: "",
    },
  });

  // Fetch all organizations for dropdown
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrgs(true);
      try {
        const res = await apiClient.get<{ data: { organizations: Organization[] } }>("/organizations/all");
        if (res.data && typeof res.data === 'object' && 'data' in res.data) {
          setOrganizations((res.data as any).data.organizations || []);
        } else {
          setOrganizations((res.data as any).organizations || []);
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
        setOrganizations([]);
      } finally {
        setLoadingOrgs(false);
      }
    };
    fetchOrganizations();
  }, []);

  // Filter organizations by search
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
    org.email.toLowerCase().includes(orgSearch.toLowerCase())
  );

  // Close dropdown when clicking outside
  const orgDropdownRef = useClickOutside<HTMLDivElement>(() => {
    setIsOrgDropdownOpen(false);
  });

  // Close dropdown when orgSearch is empty
  useEffect(() => {
    if (!orgSearch) {
      setIsOrgDropdownOpen(false);
    }
  }, [orgSearch]);

  const onSubmit: SubmitHandler<FilterValues> = (data: FilterValues) => {
    const filters: DocumentQueryParams = {
      ...data,
      organizationId: data.organizationId || undefined,
      typeId: data.typeId || undefined,
      isPublic: data.isPublic === "" ? undefined : data.isPublic === "true",
      isPremium: data.isPremium === "" ? undefined : data.isPremium === "true",
      page: 1,
    };
    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    reset();
    setOrgSearch("");
    const clearedFilters: DocumentQueryParams = {
      search: "",
      organizationId: undefined,
      typeId: undefined,
      isPublic: undefined,
      isPremium: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
    };
    onFiltersChange(clearedFilters);
  };

  const watchedFilters = watch();
  const hasActiveFilters =
    watchedFilters.search ||
    watchedFilters.organizationId ||
    watchedFilters.typeId ||
    watchedFilters.isPublic !== "" ||
    watchedFilters.isPremium !== "" ||
    watchedFilters.dateFrom ||
    watchedFilters.dateTo;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles["filters-container"]}
    >
      {/* Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
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
              placeholder="Search by title, description, or file name..."
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
        <div className="min-w-[200px] max-w-[300px]">
          <label className={styles["label"]}>Organization</label>
          <div className="relative" ref={orgDropdownRef}>
            <input
              type="text"
              placeholder="Search organization..."
              value={orgSearch}
              onChange={(e) => {
                setOrgSearch(e.target.value);
                setIsOrgDropdownOpen(true);
              }}
              onFocus={() => setIsOrgDropdownOpen(true)}
              className={styles["search-input"]}
              disabled={loading || loadingOrgs}
            />
            {isOrgDropdownOpen && orgSearch && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredOrganizations.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No organizations found</div>
                ) : (
                  filteredOrganizations.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        setValue("organizationId", org.id);
                        setOrgSearch(org.name);
                        setIsOrgDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                    >
                      {org.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <input type="hidden" {...register("organizationId")} />
        </div>

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

        <div className="min-w-[150px]">
          <label className={styles["label"]}>Public</label>
          <select
            id="isPublic"
            className={`${styles["select"]} ${errors.isPublic ? styles.error : ""}`}
            disabled={loading}
            {...register("isPublic")}
          >
            <option value="">All</option>
            <option value="true">Public</option>
            <option value="false">Private</option>
          </select>
        </div>

        <div className="min-w-[150px]">
          <label className={styles["label"]}>Premium</label>
          <select
            id="isPremium"
            className={`${styles["select"]} ${errors.isPremium ? styles.error : ""}`}
            disabled={loading}
            {...register("isPremium")}
          >
            <option value="">All</option>
            <option value="true">Premium</option>
            <option value="false">Free</option>
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
            {watchedFilters.organizationId && (
              <span className={`${styles["filter-tag"]} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}>
                Org: {organizations.find(o => o.id === watchedFilters.organizationId)?.name || watchedFilters.organizationId}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = { ...watchedFilters, organizationId: "" };
                    reset(updatedFilters);
                    setOrgSearch("");
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.isPublic !== "" && (
              <span className={`${styles["filter-tag"]} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>
                Public: {watchedFilters.isPublic === "true" ? "Yes" : "No"}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = { ...watchedFilters, isPublic: "" };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.isPremium !== "" && (
              <span className={`${styles["filter-tag"]} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>
                Premium: {watchedFilters.isPremium === "true" ? "Yes" : "No"}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = { ...watchedFilters, isPremium: "" };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
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

