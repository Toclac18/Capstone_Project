"use client";

import { useState } from "react";
import styles from "./styles.module.css";
import { ReadersProvider, useReaders } from "./provider";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import EnableButton from "./_components/Button";
import { Pagination } from "@/components/ui/pagination";

function ReadersContent() {
  const {
    readers,
    loading,
    reload,
    toggleAccess,
    reInvite,
    page,
    pageSize,
    total,
    q,
    setPage,
    setPageSize,
    setQ,
  } = useReaders();

  const [busyId, setBusyId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil((total || 0) / (pageSize || 1)));

  async function onEnable(enrollmentId: string) {
    setBusyId(enrollmentId);
    try {
      await toggleAccess(enrollmentId, true);
    } finally {
      setBusyId(null);
    }
  }

  async function onRemove(enrollmentId: string) {
    setBusyId(enrollmentId);
    try {
      await toggleAccess(enrollmentId, false);
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
              <th className={styles["header-right"]}>Invited at</th>
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
                const isBusy = busyId === r.enrollmentId;

                const invitedDisplay = r.invitedAt
                  ? new Date(r.invitedAt).toLocaleString()
                  : "-";

                return (
                  <tr key={r.enrollmentId} className={styles["table-row"]}>
                    <td>{r.memberFullName}</td>
                    <td className={styles["col-email"]}>{r.memberEmail}</td>
                    <td>{r.organizationName}</td>
                    <td>{r.status}</td>
                    <td className={styles["cell-right"]}>{invitedDisplay}</td>

                    <td className={styles["cell-right"]}>
                      {r.status === "PENDING_INVITE" ? (
                        <span className={styles["action-placeholder"]}>-</span>
                      ) : r.status === "JOINED" ? (
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
                      ) : r.status === "LEFT" ? (
                        <EnableButton
                          onClick={() => {
                            setBusyId(r.enrollmentId);
                            reInvite(r.enrollmentId).finally(() =>
                              setBusyId(null),
                            );
                          }}
                          disabled={isBusy || loading}
                          loading={isBusy}
                          className={styles["action-btn"]}
                          title="Re-invite reader"
                          label="Re-invite"
                          loadingLabel="Re-inviting..."
                          variant="reinvite"
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
                          variant="enable"
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

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        itemsPerPage={pageSize}
        onPageChange={(nextPage) => setPage(nextPage)}
        loading={loading}
      />
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
