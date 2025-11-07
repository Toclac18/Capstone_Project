// src/app/contact-admin/page.tsx
"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import { ReadersProvider, useReaders } from "./ReadersProvider";
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

  // derive range & buttons
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = end < total;

  async function onEnable(id: string) {
    setBusyId(id);
    try {
      await toggleAccess(id, true); // ACTIVE
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string) {
    setBusyId(id);
    try {
      await toggleAccess(id, false); // SUSPENDED
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
            setPage(1); // reset to first page when searching
            setQ(e.target.value);
          }}
          placeholder="Search by name, username, email, or status…"
          className={styles["readers-search"]}
        />

        <select
          value={pageSize}
          onChange={(e) => {
            setPage(1); // reset page
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
          <colgroup>
            <col />
            <col />
            <col className={styles["col-email"]} />
            <col /> {/* Status */}
            <col className={styles["col-coins"]} />
            <col className={styles["col-actions"]} />
          </colgroup>

          <thead>
            <tr>
              <th>Full name</th>
              <th>Username</th>
              <th className={styles["col-email"]}>Email</th>
              <th>Status</th>
              <th
                className={`${styles["header-right"]} ${styles["col-coins"]}`}
              >
                Coins
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
                const statusUpper = String(r.status).toUpperCase();

                const isActive = statusUpper === "ACTIVE";
                const isPending = statusUpper === "PENDING_VERIFICATION";

                const badgeClass = isActive
                  ? styles["status-active"]
                  : isPending
                    ? styles["status-pending"]
                    : styles["status-suspended"];

                const statusLabel =
                  statusUpper === "PENDING_VERIFICATION" ? "PENDING_VERIFICATION" : statusUpper;

                return (
                  <tr key={r.id} className={styles["table-row"]}>
                    <td>{r.fullName}</td>
                    <td>{r.username}</td>
                    <td className={styles["col-email"]}>{r.email}</td>
                    <td>
                      <span className={`${styles["status-badge"]} ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className={`${styles["cell-right"]} ${styles["col-coins"]}`}>
                      {r.coinBalance.toLocaleString()}
                    </td>
                    <td className={styles["cell-right"]}>
                      {!isActive ? (
                        <EnableButton
                          onClick={() => onEnable(r.id)}
                          disabled={busyId === r.id}
                          loading={busyId === r.id}
                          className={styles["action-btn"]}
                          title="Enable reader’s access"
                        />
                      ) : (
                        <DeleteConfirmation
                          onDelete={() => onDelete(r.id)}
                          itemId={r.id}
                          itemName={`${r.fullName} (${r.email})`}
                          title="Remove reader’s access"
                          description="This action cannot be undone. The reader will lose access to all resources."
                          size="sm"
                          variant="outline"
                          className={styles["action-btn"]}
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
