"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { getTickets, type Ticket, type TicketStatus } from "../api";
import { Pagination } from "@/components/ui/pagination";
import { TicketDetailModal } from "./TicketDetailModal";
import { Eye } from "lucide-react";
import styles from "../styles.module.css";
import Breadcrumb from "@/components/(template)/Breadcrumbs/Breadcrumb";

type FilterValues = {
  search: string;
  status: string;
};

const STATUS_OPTIONS: { value: TicketStatus | ""; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    status: "" as TicketStatus | "",
    email: "",
  });

  const { register, handleSubmit, reset, control, getValues } = useForm<FilterValues>({
    defaultValues: {
      search: "",
      status: "",
    },
  });

  const searchValue = useWatch({ control, name: "search" });
  const statusValue = useWatch({ control, name: "status" });

  const fetchTickets = useCallback(async (page: number, status?: TicketStatus | "", email?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTickets({
        status: status || undefined,
        email: email || undefined,
        page: page - 1,
        size: itemsPerPage,
      });
      setTickets(res.data);
      setTotalPages(res.pageInfo.totalPages);
      setTotalItems(res.pageInfo.totalElements);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(currentPage, filters.status, filters.email);
  }, [fetchTickets, currentPage, filters]);

  const onSubmit: SubmitHandler<FilterValues> = (data) => {
    setFilters({
      status: data.status as TicketStatus | "",
      email: data.search?.trim() || "",
    });
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    reset();
    setFilters({ status: "", email: "" });
    setCurrentPage(1);
  };

  const hasActiveFilters = searchValue || statusValue;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status: TicketStatus) => {
    switch (status) {
      case "NEW": return styles["status-new"];
      case "IN_PROGRESS": return styles["status-in-progress"];
      case "RESOLVED": return styles["status-resolved"];
      case "CLOSED": return styles["status-closed"];
      default: return "";
    }
  };

  const getUrgencyClass = (urgency: string) => {
    switch (urgency) {
      case "LOW": return styles["urgency-low"];
      case "NORMAL": return styles["urgency-normal"];
      case "HIGH": return styles["urgency-high"];
      default: return "";
    }
  };

  return (
    <div className={styles["container"]}>
      {/* Breadcrumb */}
      <Breadcrumb pageName="Contact Tickets" />

      {/* Error Alert */}
      {error && (
        <div className={styles["alert"] + " " + styles["alert-error"]}>
          {error}
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleSubmit(onSubmit)} className={styles["filters-container"]}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4">
          {/* Search */}
          <div className="flex-1">
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
                type="text"
                {...register("search")}
                className={styles["search-input"]}
                placeholder="Search by email..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Status */}
          <div className="w-full lg:w-48">
            <label className={styles["label"]}>Status</label>
            <select
              {...register("status")}
              className={styles["select"]}
              disabled={loading}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={loading || !hasActiveFilters}
              className={`${styles["btn"]} ${styles["btn-secondary"]}`}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${styles["btn"]} ${styles["btn-primary"]}`}
            >
              {loading ? "..." : "Apply"}
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
                  Email: {searchValue}
                  <button
                    type="button"
                    onClick={() => {
                      const currentValues = getValues();
                      reset({ ...currentValues, search: "" });
                      onSubmit({ ...currentValues, search: "" });
                    }}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusValue && (
                <span className={`${styles["filter-tag"]} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`}>
                  Status: {STATUS_OPTIONS.find(o => o.value === statusValue)?.label}
                  <button
                    type="button"
                    onClick={() => {
                      const currentValues = getValues();
                      reset({ ...currentValues, status: "" });
                      onSubmit({ ...currentValues, status: "" });
                    }}
                    className="ml-1 hover:text-purple-600"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Table Container */}
      <div className={styles["table-container"]}>
        {loading ? (
          <div className={styles["loading-container"]}>
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading tickets...
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className={styles["empty-container"]}>
            <p>No tickets found</p>
          </div>
        ) : (
          <>
            <table className={styles["table"]}>
              <thead className={styles["table-header"]}>
                <tr>
                  <th className={styles["table-header-cell"]}>Code</th>
                  <th className={styles["table-header-cell"]}>Email</th>
                  <th className={styles["table-header-cell"]}>Subject</th>
                  <th className={styles["table-header-cell"]}>Category</th>
                  <th className={styles["table-header-cell"]}>Urgency</th>
                  <th className={styles["table-header-cell"]}>Status</th>
                  <th className={styles["table-header-cell"]}>Created</th>
                  <th className={styles["table-header-cell"] + " " + styles["table-header-cell-center"]}>Action</th>
                </tr>
              </thead>
              <tbody className={styles["table-body"]}>
                {tickets.map((ticket) => (
                  <tr key={ticket.ticketId} className={styles["table-row"]}>
                    <td className={styles["table-cell"]}>
                      <span className={styles["ticket-code"]}>{ticket.ticketCode}</span>
                    </td>
                    <td className={styles["table-cell"]}>
                      <p className="truncate max-w-[180px]" title={ticket.email}>
                        {ticket.email}
                      </p>
                    </td>
                    <td className={styles["table-cell"]}>
                      <p className="truncate max-w-[200px]" title={ticket.subject}>
                        {ticket.subject}
                      </p>
                    </td>
                    <td className={styles["table-cell"]}>
                      <span className={styles["category-badge"]}>{ticket.category}</span>
                    </td>
                    <td className={styles["table-cell"]}>
                      <span className={`${styles["urgency-badge"]} ${getUrgencyClass(ticket.urgency)}`}>
                        {ticket.urgency}
                      </span>
                    </td>
                    <td className={styles["table-cell"]}>
                      <span className={`${styles["status-badge"]} ${getStatusClass(ticket.status)}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className={styles["table-cell"]}>
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className={styles["table-cell"] + " " + styles["table-cell-center"]}>
                      <div className={styles["action-cell"]}>
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className={styles["action-icon-btn"]}
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalItems > itemsPerPage && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => fetchTickets(currentPage, filters.status, filters.email)}
        />
      )}
    </div>
  );
}
