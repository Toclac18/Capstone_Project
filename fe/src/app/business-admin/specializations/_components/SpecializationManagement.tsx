"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import type {
  Specialization,
  SpecializationQueryParams,
  SpecializationResponse,
} from "../api";
import { getSpecializations, createSpecialization, updateSpecialization } from "../api";
import { getDomains } from "@/app/business-admin/domains/api";
import type { Domain } from "@/app/business-admin/domains/api";
import { Pagination } from "@/components/ui/pagination";
import { AddSpecializationModal } from "./AddSpecializationModal";
import { UpdateSpecializationModal } from "./UpdateSpecializationModal";
import { Plus, Edit2, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import styles from "../styles.module.css";

type FilterValues = {
  search: string;
};

export function SpecializationManagement() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const domainIdFromUrl = searchParams.get("domainId") || "";
  
  const [selectedDomainId, setSelectedDomainId] = useState<string>(domainIdFromUrl);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [allSpecializations, setAllSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<"name" | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(undefined);

  const {
    register,
    handleSubmit,
    control,
  } = useForm<FilterValues>({
    defaultValues: {
      search: "",
    },
  });

  const searchValue = useWatch({ control, name: "search" });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] =
    useState<Specialization | null>(null);

  // Fetch domain info on mount
  useEffect(() => {
    const fetchDomain = async () => {
      if (!domainIdFromUrl) {
        setError("Domain ID is required. Please select a domain from the domains list.");
        return;
      }

      try {
        const response = await getDomains();
        const domain = response.domains.find((d) => d.id === domainIdFromUrl);
        
        if (domain) {
          setSelectedDomainId(domainIdFromUrl);
          setSelectedDomain(domain);
        } else {
          setError("Domain not found");
        }
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error ? e.message : "Failed to fetch domain";
        setError(errorMessage);
      }
    };
    fetchDomain();
  }, [domainIdFromUrl]);

  // Fetch specializations when domain changes
  const fetchSpecializations = useCallback(
    async (domainId: string, search?: string) => {
      if (!domainId) return;

      setLoading(true);
      setError(null);

      try {
        const params: SpecializationQueryParams = {
          domainId,
          search: search?.trim() || undefined,
        };
        const response: SpecializationResponse = await getSpecializations(params);
        setAllSpecializations(response.specializations);
        setCurrentPage(1); // Reset to first page when search/filter changes
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error
            ? e.message
            : "Failed to fetch specializations";
        setError(errorMessage);
        setAllSpecializations([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load when domain is selected
  useEffect(() => {
    if (selectedDomainId) {
      fetchSpecializations(selectedDomainId, "");
    }
  }, [selectedDomainId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sort and paginate specializations in frontend
  const sortedAndPaginatedSpecializations = useMemo(() => {
    // If no sort, return original order
    if (!sortBy || !sortOrder) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return allSpecializations.slice(startIndex, endIndex);
    }
    
    // Create a copy to avoid mutating the original array
    const sorted = [...allSpecializations].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      // sortBy === "name"
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();

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
  }, [allSpecializations, sortBy, sortOrder, currentPage, itemsPerPage]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle column sort - 3 states: no sort -> asc -> desc -> no sort
  const handleSort = (column: "name") => {
    const currentSortBy = sortBy;
    const currentSortOrder = sortOrder;
    
    let newSortBy: "name" | undefined = column;
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
    
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Get sort icon for a column
  const getSortIcon = (column: "name") => {
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

  // Handle back to domains
  const handleBackToDomains = () => {
    router.push("/business-admin/domains");
  };

  // Handle search button click - search only when button is clicked
  const handleSearchClick = (data: FilterValues) => {
    if (selectedDomainId) {
      fetchSpecializations(selectedDomainId, data.search || "");
    }
  };

  // Handle add specialization
  const handleAddSpecialization = useCallback(
    async (code: number, name: string, domainId: string) => {
      await createSpecialization({ code, name, domainId });
      await fetchSpecializations(domainId, searchValue);
    },
    [fetchSpecializations, searchValue]
  );

  // Handle update specialization
  const handleUpdateSpecialization = useCallback(
    async (id: string, name: string) => {
      await updateSpecialization(id, { name });
      if (selectedDomainId) {
        await fetchSpecializations(selectedDomainId, searchValue);
      }
    },
    [selectedDomainId, fetchSpecializations, searchValue]
  );

  // Handle open update modal
  const handleOpenUpdateModal = (specialization: Specialization) => {
    setSelectedSpecialization(specialization);
    setIsUpdateModalOpen(true);
  };

  return (
    <div className={styles["container"]}>
      {/* Error Alert */}
      {error && (
        <div className={styles["alert"] + " " + styles["alert-error"]}>
          {error}
        </div>
      )}

      {/* Domain Info and Back Button */}
      {selectedDomain && (
        <div className={styles["filters-container"]}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={handleBackToDomains}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Domains
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">
                Specializations for: {selectedDomain.name}
              </h2>
            </div>
          </div>

           {/* Search Bar */}
            <form onSubmit={handleSubmit(handleSearchClick)}>
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
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
                      placeholder="Search by specialization name..."
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`${styles["btn"]} ${styles["btn-primary"]} min-w-[100px]`}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>
        </div>
      )}

      {/* Add Specialization Button */}
      {selectedDomainId && (
        <div className="my-2 flex justify-end">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className={`${styles["btn"]} ${styles["btn-primary"]} inline-flex items-center`}
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Specialization
          </button>
        </div>
      )}

      {/* Specializations List */}
      {selectedDomainId && selectedDomain ? (
        <div className={styles["table-container"]}>
          {loading ? (
            <div className={styles["loading-container"]}>
              <p>Loading specializations...</p>
            </div>
          ) : allSpecializations.length === 0 ? (
            <div className={styles["empty-container"]}>
              <p>No specializations found. You can add new.</p>
            </div>
          ) : (
            <>
              <table className={styles["table"]}>
                <colgroup>
                  <col className={styles["col-name"]} />
                  <col className={styles["col-action"]} />
                </colgroup>
                <thead className={styles["table-header"]}>
                  <tr>
                    <th 
                      className={styles["table-header-cell"] + " " + styles["sortable-header"]}
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Specialization Name
                        {getSortIcon("name")}
                      </div>
                    </th>
                    <th
                      className={
                        styles["table-header-cell"] +
                        " " +
                        styles["table-header-cell-right"]
                      }
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className={styles["table-body"]}>
                  {sortedAndPaginatedSpecializations.map((spec) => (
                    <tr key={spec.id} className={styles["table-row"]}>
                      <td className={styles["table-cell"]}>
                        <span className={styles["table-cell-main"]}>
                          {spec.name}
                        </span>
                      </td>
                      <td
                        className={
                          styles["table-cell"] +
                          " " +
                          styles["table-cell-right"]
                        }
                      >
                        <div className={styles["action-cell"]}>
                          <button
                            onClick={() => handleOpenUpdateModal(spec)}
                            className={styles["action-icon-btn"]}
                            disabled={loading}
                            title="Update Specialization"
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
              {allSpecializations.length > itemsPerPage && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(allSpecializations.length / itemsPerPage)}
                    totalItems={allSpecializations.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    loading={loading}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ) : !domainIdFromUrl ? (
        <div className={styles["empty-container"]}>
          <p>Please select a domain from the domains list to view specializations.</p>
        </div>
      ) : null}

      {/* Modals */}
      {selectedDomain && (
        <AddSpecializationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          domainId={selectedDomain.id}
          domainName={selectedDomain.name}
          onAdd={handleAddSpecialization}
        />
      )}

      <UpdateSpecializationModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedSpecialization(null);
        }}
        specialization={selectedSpecialization}
        onUpdate={handleUpdateSpecialization}
      />
    </div>
  );
}

