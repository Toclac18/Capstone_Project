"use client";

import { useState } from "react";
import { updateTicket, type Ticket, type TicketStatus } from "../api";
import styles from "../styles.module.css";

type Props = {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: () => void;
};

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export function TicketDetailModal({ ticket, onClose, onUpdate }: Props) {
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [adminNotes, setAdminNotes] = useState(ticket.adminNotes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReadOnly = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

  const handleSave = async () => {
    if (isReadOnly) return;
    
    setSaving(true);
    setError(null);
    try {
      await updateTicket(ticket.ticketId, { 
        status, 
        adminNotes: adminNotes.trim() || undefined 
      });
      onUpdate();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update ticket");
    } finally {
      setSaving(false);
    }
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

  const hasChanges = status !== ticket.status || adminNotes !== (ticket.adminNotes || "");

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={onClose} />
      <div className={styles["modal-container"]}>
        <div className={styles["modal-card"]}>
          {/* Header */}
          <div className={styles["modal-header"]}>
            <div>
              <h2 className={styles["modal-title"]}>Ticket #{ticket.ticketCode}</h2>
              <p className={styles["modal-subtitle"]}>
                {isReadOnly ? "View Only" : "View & Respond"}
              </p>
            </div>
            <button className={styles["modal-close-button"]} onClick={onClose}>
              ×
            </button>
          </div>

          {/* Content */}
          <div className={styles["modal-content"]}>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            {/* User Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">From:</span>
                <p className="font-medium text-gray-900 dark:text-white">{ticket.name}</p>
                <p className="text-gray-600 dark:text-gray-400">{ticket.email}</p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(ticket.createdAt)}</p>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-3 py-3 border-y border-gray-100 dark:border-gray-700">
              <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {ticket.category}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                ticket.urgency === "HIGH" 
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : ticket.urgency === "NORMAL"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}>
                {ticket.urgency} Priority
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                ticket.status === "NEW"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : ticket.status === "IN_PROGRESS"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : ticket.status === "RESOLVED"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
              }`}>
                {ticket.status.replace("_", " ")}
              </span>
            </div>

            {/* Subject */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Subject</h3>
              <p className="text-gray-900 dark:text-white">{ticket.subject}</p>
            </div>

            {/* Message */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Message</h3>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ticket.ticketMessage}
              </div>
            </div>

            {/* Previous Admin Notes (if exists and readonly) */}
            {isReadOnly && ticket.adminNotes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Admin Response</h3>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {ticket.adminNotes}
                </div>
              </div>
            )}

            {/* Response Section - Only show if not readonly */}
            {!isReadOnly && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Respond to Ticket
                </h3>
                
                {/* Status */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Status
                  </label>
                  <select
                    className={styles["select"]}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Response */}
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Response (sent via email)
                  </label>
                  <textarea
                    className={styles["input"] + " min-h-[100px] resize-y"}
                    placeholder="Write your response..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles["modal-footer"]}>
            <button className={styles["modal-button-cancel"]} onClick={onClose}>
              {isReadOnly ? "Close" : "Cancel"}
            </button>
            {!isReadOnly && (
              <button
                className={styles["modal-button-submit"]}
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? "Sending..." : "Send Response"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
