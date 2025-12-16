// src/app/business-admin/document/_components/DocumentFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import type { DocumentQueryParams } from "../api";
import { apiClient } from "@/services/http";
import type { Organization } from "@/types/organization";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useToast, toast } from "@/components/ui/toast";
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

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "AI_VERIFYING", label: "AI Verifying" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "AI_REJECTED", label: "AI Rejected" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "PENDING_APPROVE", label: "Pending Approve" },
  { value: "ACTIVE", label: "Active" },
  { value: "REJECTED", label: "Rejected" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "DELETED", label: "Deleted" },
] as const;

type FilterValues = {
  search: string;
  organizationId: string;
  typeId: string;
  isPublic: string;
  isPremium: string;
  status: string;
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
  const { showToast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgSearch, setOrgSearch] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      status: "",
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
        // Use business-admin organizations endpoint (goes through Next.js API route)
        // This endpoint already maps AdminOrganizationResponse to Organization format
        const res = await apiClient.get<{
          organizations: Organization[];
          total: number;
          page: number;
          limit: number;
        }>("/business-admin/organizations?page=1&limit=1000");
        
        if (res.data && res.data.organizations) {
          setOrganizations(res.data.organizations);
        } else {
          setOrganizations([]);
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
    // Validate date range
    if (data.dateFrom && data.dateTo) {
      const fromDate = new Date(data.dateFrom);
      const toDate = new Date(data.dateTo);
      if (fromDate > toDate) {
        showToast(toast.error("Validation Error", "Date From must be before or equal to Date To"));
        return;
      }
    }
    
    const filters: DocumentQueryParams = {
      ...data,
      search: data.search?.trim() || undefined,
      organizationId: data.organizationId || undefined,
      typeId: data.typeId || undefined,
      isPublic: data.isPublic === "" ? undefined : data.isPublic === "true",
      isPremium: data.isPremium === "" ? undefined : data.isPremium === "true",
      // Only include status if explicitly selected, otherwise exclude DELETED by default
      status: data.status || undefined,
      dateFrom: data.dateFrom || undefined,
      dateTo: data.dateTo || undefined,
      page: 1,
      // Exclude DELETED when status is not selected (deleted: false means exclude deleted)
      deleted: data.status ? undefined : false,
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
      status: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
      dateFrom: undefined,
      dateTo: undefined,
      page: 1,
      deleted: false, // Exclude DELETED by default
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
    watchedFilters.status !== "" ||
    watchedFilters.dateFrom ||
    watchedFilters.dateTo;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles["filters-container"]}
    >
      {/* Main Filter Row - Compact Layout */}
      <div className="flex flex-col lg:flex-row gap-3 items-end">
        {/* Search Bar */}
        <div className="flex-1 w-full lg:min-w-[300px]">
          <label className={`${styles["label"]} mb-1.5`}>Search</label>
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

        {/* Organization */}
        <div className="w-full lg:w-[200px]">
          <label className={`${styles["label"]} mb-1.5`}>Organization</label>
          <div className="relative" ref={orgDropdownRef}>
            <input
              type="text"
              placeholder="Select organization..."
              value={orgSearch}
              onChange={(e) => {
                setOrgSearch(e.target.value);
                setIsOrgDropdownOpen(true);
              }}
              onFocus={() => setIsOrgDropdownOpen(true)}
              className={`${styles["search-input"]} pl-10`}
              disabled={loading || loadingOrgs}
              style={{ paddingLeft: '2.5rem' }}
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
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
            {isOrgDropdownOpen && orgSearch && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredOrganizations.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500 dark:text-gray-400">No organizations found</div>
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

        {/* Status */}
        <div className="w-full lg:w-[160px]">
          <label className={`${styles["label"]} mb-1.5`}>Status</label>
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

        {/* Visibility */}
        <div className="w-full lg:w-[130px]">
          <label className={`${styles["label"]} mb-1.5`}>Visibility</label>
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

        {/* Premium */}
        <div className="w-full lg:w-[130px]">
          <label className={`${styles["label"]} mb-1.5`}>Premium</label>
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

        {/* Action Buttons */}
        <div className="flex gap-2 w-full lg:w-auto items-end">
          <button
            type="submit"
            disabled={loading}
            className={`${styles["btn"]} ${styles["btn-primary"]} whitespace-nowrap flex-1 lg:flex-none h-[52px]`}
          >
            {loading ? "Searching..." : "Search"}
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
            className={`${styles["btn"]} ${styles["btn-secondary"]} whitespace-nowrap h-[52px]`}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Advanced Filters - Collapsible */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Advanced Filters
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date From */}
            <div>
              <label htmlFor="dateFrom" className={`${styles["label"]} mb-1.5`}>
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

            {/* Date To */}
            <div>
              <label htmlFor="dateTo" className={`${styles["label"]} mb-1.5`}>
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

            {/* Sort By */}
            <div>
              <label className={`${styles["label"]} mb-1.5`}>Sort By</label>
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

            {/* Sort Order */}
            <div>
              <label className={`${styles["label"]} mb-1.5`}>Sort Order</label>
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
        )}
      </div>

      {/* Active Filters Summary - Compact */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">
              Active:
            </span>
            {watchedFilters.search && (
              <span className={`${styles["filter-tag"]} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-0.5`}>
                {watchedFilters.search.length > 20 ? watchedFilters.search.substring(0, 20) + "..." : watchedFilters.search}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = { ...watchedFilters, search: "" };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1.5 hover:font-bold"
                  title="Remove filter"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.organizationId && (
              <span className={`${styles["filter-tag"]} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-0.5`}>
                {organizations.find(o => o.id === watchedFilters.organizationId)?.name || "Org"}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = { ...watchedFilters, organizationId: "" };
                    reset(updatedFilters);
                    setOrgSearch("");
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1.5 hover:font-bold"
                  title="Remove filter"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.isPublic !== "" && (
              <span className={`${styles["filter-tag"]} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-0.5`}>
                {watchedFilters.isPublic === "true" ? "Public" : "Private"}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = { ...watchedFilters, isPublic: "" };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1.5 hover:font-bold"
                  title="Remove filter"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.isPremium !== "" && (
              <span className={`${styles["filter-tag"]} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs px-2 py-0.5`}>
                {watchedFilters.isPremium === "true" ? "Premium" : "Free"}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = { ...watchedFilters, isPremium: "" };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1.5 hover:font-bold"
                  title="Remove filter"
                >
                  ×
                </button>
              </span>
            )}
            {watchedFilters.status !== "" && (
              <span className={`${styles["filter-tag"]} bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs px-2 py-0.5`}>
                {STATUS_OPTIONS.find(s => s.value === watchedFilters.status)?.label || watchedFilters.status}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = { ...watchedFilters, status: "" };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1.5 hover:font-bold"
                  title="Remove filter"
                >
                  ×
                </button>
              </span>
            )}
            {(watchedFilters.dateFrom || watchedFilters.dateTo) && (
              <span className={`${styles["filter-tag"]} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs px-2 py-0.5`}>
                {watchedFilters.dateFrom || "..."} - {watchedFilters.dateTo || "..."}
                <button
                  type="button"
                  onClick={() => {
                    const updatedFilters = { ...watchedFilters, dateFrom: "", dateTo: "" };
                    reset(updatedFilters);
                    onSubmit(updatedFilters);
                  }}
                  className="ml-1.5 hover:font-bold"
                  title="Remove filter"
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

