"use client";

import { useMemo, useState } from "react";
import styles from "./styles.module.css";
import { ReadersProvider, useReaders } from "./ReadersProvider";
import DeleteConfirmation from "@/components/ui/delete-confirmation";
import EnableButton from "./_components/EnableButton";

function ReadersContent() {
  const { readers, loading, reload, toggleAccess } = useReaders();
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return readers;
    return readers.filter(
      (r) =>
        r.fullName.toLowerCase().includes(s) ||
        r.username.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        r.status.toLowerCase().includes(s),
    );
  }, [q, readers]);

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
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, username, email, or status…"
          className={styles["readers-search"]}
        />
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles["cell-right"]}>
                  No readers found
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const isSuspended = r.status === "SUSPENDED";
                return (
                  <tr key={r.id} className={styles["table-row"]}>
                    <td>{r.fullName}</td>
                    <td>{r.username}</td>
                    <td className={styles["col-email"]}>{r.email}</td>
                    <td>
                      <span
                        className={`${styles["status-badge"]} ${
                          r.status === "ACTIVE"
                            ? styles["status-active"]
                            : r.status === "SUSPENDED"
                              ? styles["status-suspended"]
                              : styles["status-pending"]
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td
                      className={`${styles["cell-right"]} ${styles["col-coins"]}`}
                    >
                      {r.coinBalance.toLocaleString()}
                    </td>
                    <td className={styles["cell-right"]}>
                      {isSuspended ? (
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
