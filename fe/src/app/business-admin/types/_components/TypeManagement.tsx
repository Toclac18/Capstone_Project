"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import type { Type, TypeQueryParams, TypeResponse } from "../api";
import { getTypes, createType, updateType } from "../api";
import { Pagination } from "@/components/ui/pagination";
import { AddTypeModal } from "./AddTypeModal";
import { UpdateTypeModal } from "./UpdateTypeModal";
import { Plus, Edit2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import styles from "../styles.module.css";

type FilterValues = {
  search: string;
  dateFrom: string;
  dateTo: string;
};

export function TypeManagement() {
  const [allTypes, setAllTypes] = useState<Type[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [filters, setFilters] = useState<TypeQueryParams>({
    page: 1,
    limit: 10,
    search: "",
    dateFrom: undefined,
    dateTo: undefined,
    sortBy: undefined,
    sortOrder: undefined,
  });

  // Form for filters (not applied until "Apply Filters" is clicked)
  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
  } = useForm<FilterValues>({
    defaultValues: {
      search: "",
      dateFrom: "",
      dateTo: "",
    },
  });

  // Watch specific fields instead of entire form to avoid React Compiler warning
  const searchValue = useWatch({ control, name: "search" });
  const dateFromValue = useWatch({ control, name: "dateFrom" });
  const dateToValue = useWatch({ control, name: "dateTo" });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<Type | null>(null);

  // Fetch types with current filters
  const fetchTypes = useCallback(
    async (queryParams: TypeQueryParams) => {
      setLoading(true);
      setError(null);

      try {
        // Don't send sortBy, sortOrder, page, limit to BE - handle in FE
        const { sortBy: _sortBy, sortOrder: _sortOrder, page: _page, limit: _limit, ...filterParams } = queryParams;
        const response: TypeResponse = await getTypes(filterParams);
        setAllTypes(response.types);
        setTotalItems(response.types.length); // Total after filtering (before pagination)
        setCurrentPage(queryParams.page || 1);
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : "Failed to fetch types";
        setError(errorMessage);
        setAllTypes([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchTypes(filters);
    // Sync form with initial filters
    reset({
      search: filters.search || "",
      dateFrom: filters.dateFrom || "",
      dateTo: filters.dateTo || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters when form is submitted
  const onSubmit: SubmitHandler<FilterValues> = (data: FilterValues) => {
    const newFilters: TypeQueryParams = {
      ...filters,
      search: data.search?.trim() || undefined,
      dateFrom: data.dateFrom || undefined,
      dateTo: data.dateTo || undefined,
      page: 1,
      limit: itemsPerPage,
    };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchTypes(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    reset();
    const clearedFilters: TypeQueryParams = {
      page: 1,
      limit: itemsPerPage,
      search: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
    fetchTypes(clearedFilters);
  };

  // Check if there are active filters
  const hasActiveFilters = 
    searchValue ||
    dateFromValue ||
    dateToValue;

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters({ ...filters, page });
    // Don't refetch - just update page for pagination
  };

  // Handle add type
  const handleAddType = useCallback(
    async (name: string) => {
      await createType({ name });
      await fetchTypes(filters);
    },
    [filters, fetchTypes]
  );

  // Handle update type
  const handleUpdateType = useCallback(
    async (id: string, name: string) => {
      await updateType(id, { name });
      await fetchTypes(filters);
    },
    [filters, fetchTypes]
  );

  // Handle open update modal
  const handleOpenUpdateModal = (type: Type) => {
    setSelectedType(type);
    setIsUpdateModalOpen(true);
  };

  // Handle column sort
  const handleSort = useCallback((column: "name" | "createdDate" | "id") => {
    const currentSortBy = filters.sortBy;
    const currentSortOrder = filters.sortOrder;
    
    let newSortBy: "name" | "createdDate" | "id" | undefined = column;
    let newSortOrder: "asc" | "desc" | undefined = "asc";
    
    // If clicking on the same column, cycle through: undefined -> asc -> desc -> undefined
    if (currentSortBy === column) {
      if (currentSortOrder === undefined) {
        newSortOrder = "asc";
      } else if (currentSortOrder === "asc") {
        newSortOrder = "desc";
      } else {
        // desc -> undefined (no sort)
        newSortBy = undefined;
        newSortOrder = undefined;
      }
    }
    
    // Update filters but don't refetch - sorting is done in FE
    setFilters({
      ...filters,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
      page: 1,
    });
    setCurrentPage(1);
  }, [filters]);

  // Sort and paginate types in FE
  const sortedAndPaginatedTypes = useMemo(() => {
    const sortBy = filters.sortBy;
    const sortOrder = filters.sortOrder;
    
    // If no sort, return original order
    if (!sortBy || !sortOrder) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return allTypes.slice(startIndex, endIndex);
    }
    
    // Create a copy to avoid mutating the original array
    const sorted = [...allTypes].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortBy === "name") {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (sortBy === "id") {
        aValue = a.id.toLowerCase();
        bValue = b.id.toLowerCase();
      } else {
        aValue = new Date(a.createdDate).getTime();
        bValue = new Date(b.createdDate).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // Paginate
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  }, [allTypes, filters.sortBy, filters.sortOrder, currentPage, itemsPerPage]);

  // Get sort icon for a column
  const getSortIcon = (column: "name" | "createdDate" | "id") => {
    const sortBy = filters.sortBy;
    const sortOrder = filters.sortOrder;
    
    // If this column is not being sorted, show neutral icon
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    
    // If this column is being sorted, show direction
    if (sortOrder === "asc") {
      return <ArrowUp className="w-4 h-4 ml-1 text-primary" />;
    } else if (sortOrder === "desc") {
      return <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
    } else {
      // Should not happen, but show neutral icon
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={styles["container"]}>
      {/* Error Alert */}
      {error && (
        <div className={styles["alert"] + " " + styles["alert-error"]}>
          {error}
        </div>
      )}

      {/* Filters */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles["filters-container"]}
      >
        {/* Search Bar and Action Buttons */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-6">
          <div className="flex-1 relative">
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
                {...register("search")}
                className={styles["search-input"]}
                placeholder="Search by type name or ID..."
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
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
              {loading ? "Filtering..." : "Apply Filters"}
            </button>
          </div>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="dateFrom" className={styles["label"]}>
              Date From
            </label>
            <input
              id="dateFrom"
              type="date"
              {...register("dateFrom")}
              className={styles["input"]}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="dateTo" className={styles["label"]}>
              Date To
            </label>
            <input
              id="dateTo"
              type="date"
              {...register("dateTo")}
              className={styles["input"]}
              disabled={loading}
            />
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
              {(dateFromValue || dateToValue) && (
                <span className={`${styles["filter-tag"]} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`}>
                  Date: {dateFromValue || "Start"} - {dateToValue || "End"}
                  <button
                    type="button"
                    onClick={() => {
                      const currentValues = getValues();
                      const updatedFilters = { ...currentValues, dateFrom: "", dateTo: "" };
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

      {/* Add Type Button */}
      <div className="my-2 flex justify-end">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={`${styles["btn"]} ${styles["btn-primary"]} inline-flex items-center`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Type
        </button>
      </div>

      {/* Table Container */}
      <div className={styles["table-container"]}>
        {loading ? (
          <div className={styles["loading-container"]}>
            <p>Loading types...</p>
          </div>
        ) : sortedAndPaginatedTypes.length === 0 ? (
          <div className={styles["empty-container"]}>
            <p>No types found in the system</p>
          </div>
        ) : (
          <>
            <table className={styles["table"]}>
              <colgroup>
                <col className={styles["col-id"]} />
                <col className={styles["col-name"]} />
                <col className={styles["col-date"]} />
                <col className={styles["col-action"]} />
              </colgroup>
              <thead className={styles["table-header"]}>
                <tr>
                  <th 
                    className={styles["table-header-cell"] + " " + styles["sortable-header"]}
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center">
                      Type ID
                      {getSortIcon("id")}
                    </div>
                  </th>
                  <th 
                    className={styles["table-header-cell"] + " " + styles["sortable-header"]}
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Type Name
                      {getSortIcon("name")}
                    </div>
                  </th>
                  <th 
                    className={styles["table-header-cell"] + " " + styles["sortable-header"]}
                    onClick={() => handleSort("createdDate")}
                  >
                    <div className="flex items-center">
                      Created Date
                      {getSortIcon("createdDate")}
                    </div>
                  </th>
                  <th className={styles["table-header-cell"] + " " + styles["table-header-cell-right"]}>Action</th>
                </tr>
              </thead>
              <tbody className={styles["table-body"]}>
                {sortedAndPaginatedTypes.map((type) => (
                  <tr key={type.id} className={styles["table-row"]}>
                    <td className={styles["table-cell"]}>
                      <span className={styles["table-cell-main"]}>{type.id}</span>
                    </td>
                    <td className={styles["table-cell"]}>
                      <span className={styles["table-cell-main"]}>{type.name}</span>
                    </td>
                    <td className={styles["table-cell"]}>
                      {formatDate(type.createdDate)}
                    </td>
                    <td className={styles["table-cell"] + " " + styles["table-cell-right"]}>
                      <div className={styles["action-cell"]}>
                        <button
                          onClick={() => handleOpenUpdateModal(type)}
                          className={styles["action-icon-btn"]}
                          disabled={loading}
                          title="Update Type"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalItems > itemsPerPage && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalItems / itemsPerPage)}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  loading={loading}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddTypeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddType}
      />

      <UpdateTypeModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedType(null);
        }}
        type={selectedType}
        onUpdate={handleUpdateType}
      />
    </div>
  );
}

