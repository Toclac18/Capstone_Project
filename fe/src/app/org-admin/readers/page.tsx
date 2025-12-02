// src/app/org-admin/readers/page.tsx
"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import { ReadersProvider, useReaders } from "./provider";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import EnableButton from "./_components/EnableButton";

function ReadersContent() {
  const {
    readers,
    loading,
    reload,
    toggleAccess,
    page,
    pageSize,
    total,
    q,
    setPage,
    setPageSize,
    setQ,
  } = useReaders();

  const [busyId, setBusyId] = useState<string | null>(null);

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = end < total;

  async function onEnable(enrollmentId: string) {
    setBusyId(enrollmentId);
    try {
      await toggleAccess(enrollmentId, true); // → JOINED
    } finally {
      setBusyId(null);
    }
  }

  async function onRemove(enrollmentId: string) {
    setBusyId(enrollmentId);
    try {
      await toggleAccess(enrollmentId, false); // → REMOVED
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={styles["readers-container"]}>
      <h1 className={styles["readers-title"]}>Admin · Readers</h1>

      {/* Toolbar */}
      <div className={styles["readers-toolbar"]}>
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Search by name, email, organization, or status…"
          className={styles["readers-search"]}
        />

        <select
          value={pageSize}
          onChange={(e) => {
            setPage(1);
            setPageSize(Number(e.target.value));
          }}
          className={styles["readers-pagesize"]}
          disabled={loading}
          title="Rows per page"
        >
          {[10, 20, 50, 100].map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>

        <button
          onClick={reload}
          className={styles["readers-reload-btn"]}
          disabled={loading}
          title="Reload readers list"
        >
          {loading ? "Loading..." : "Reload"}
        </button>
      </div>

      {/* Table */}
      <div className={styles["table-container"]}>
        <table className={styles["table"]}>
          <thead>
            <tr>
              <th>Full name</th>
              <th className={styles["col-email"]}>Email</th>
              <th>Organization</th>
              <th>Status</th>
              <th
                className={`${styles["header-right"]} ${styles["col-coins"]}`}
              >
                Invited at
              </th>
              <th className={styles["header-right"]}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles["cell-right"]}>
                  Loading…
                </td>
              </tr>
            ) : readers.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles["cell-right"]}>
                  No readers found
                </td>
              </tr>
            ) : (
              readers.map((r) => {
                const status = r.status; // "PENDING_INVITE" | "JOINED" | "REMOVED"

                const isPending = status === "PENDING_INVITE";
                const isJoined = status === "JOINED";
                const isRemoved = status === "REMOVED";

                const badgeClass = isJoined
                  ? styles["status-active"]
                  : isPending
                    ? styles["status-pending"]
                    : styles["status-suspended"];

                const statusLabel = status; // BE sau này có thể map sang displayName nếu muốn

                const invitedDisplay = r.invitedAt
                  ? new Date(r.invitedAt).toLocaleString()
                  : "-";

                const isBusy = busyId === r.enrollmentId;

                return (
                  <tr key={r.enrollmentId} className={styles["table-row"]}>
                    <td>{r.memberFullName}</td>
                    <td className={styles["col-email"]}>{r.memberEmail}</td>
                    <td>{r.organizationName}</td>
                    <td>
                      <span
                        className={`${styles["status-badge"]} ${badgeClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td
                      className={`${styles["cell-right"]} ${styles["col-coins"]}`}
                    >
                      {invitedDisplay}
                    </td>
                    <td className={styles["cell-right"]}>
                      {isPending ? (
                        <span className={styles["action-placeholder"]}>-</span>
                      ) : isJoined ? (
                        <DeleteConfirmation
                          onDelete={() => onRemove(r.enrollmentId)}
                          itemId={r.enrollmentId}
                          itemName={`${r.memberFullName} (${r.memberEmail})`}
                          title="Remove reader’s access"
                          description="This action cannot be undone. The reader will lose access to all resources."
                          size="sm"
                          variant="outline"
                          className={styles["action-btn"]}
                        />
                      ) : (
                        <EnableButton
                          onClick={() => onEnable(r.enrollmentId)}
                          disabled={isBusy || loading}
                          loading={isBusy}
                          className={styles["action-btn"]}
                          title="Enable reader’s access"
                          label="Enable"
                          loadingLabel="Enabling..."
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className={styles["readers-pagination"]}>
        <span className={styles["readers-range"]}>
          {total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
        </span>
        <div className={styles["readers-page-controls"]}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={!hasPrev || loading}
            className={styles["page-btn"]}
          >
            Prev
          </button>
          <span className={styles["readers-page"]}>Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasNext || loading}
            className={styles["page-btn"]}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReadersPage() {
  return (
    <ReadersProvider>
      <ReadersContent />
    </ReadersProvider>
  );
}
