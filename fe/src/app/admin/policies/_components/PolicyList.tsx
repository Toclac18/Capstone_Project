"use client";

import { Eye, Edit, CheckCircle, XCircle } from "lucide-react";
import type { Policy } from "@/types/policy";
import styles from "./styles.module.css";

interface PolicyListProps {
  policies: Policy[];
  loading: boolean;
  onView: (policy: Policy) => void;
  onEdit: (policy: Policy) => void;
  onActivate: (policy: Policy) => void;
}

export function PolicyList({
  policies,
  loading,
  onView,
  onEdit,
  onActivate,
}: PolicyListProps) {
  if (loading) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading policies...</p>
        </div>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className={styles.tableContainer}>
        <div className={styles.empty}>
          <p>No policy versions found. Create your first version to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Version</th>
            <th>Title</th>
            <th>Status</th>
            <th>Created At</th>
            <th className={styles.actionHeader}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy) => (
            <tr key={policy.id} className={policy.isActive ? styles.activeRow : ""}>
              <td>
                <span className={styles.version}>{policy.version}</span>
              </td>
              <td>
                <div className={styles.titleCell}>
                  <span className={styles.title}>{policy.title}</span>
                </div>
              </td>
              <td>
                {policy.isActive ? (
                  <span className={styles.statusActive}>
                    <CheckCircle className={styles.statusIcon} />
                    Active
                  </span>
                ) : (
                  <span className={styles.statusInactive}>
                    <XCircle className={styles.statusIcon} />
                    Inactive
                  </span>
                )}
              </td>
              <td>
                <span className={styles.date}>
                  {new Date(policy.createdAt).toLocaleDateString()}
                </span>
              </td>
              <td className={styles.actionCellWrapper}>
                <div className={styles.actionCell}>
                  <button
                    type="button"
                    className={styles.actionIconBtn}
                    onClick={() => onView(policy)}
                    title="View Policy"
                  >
                    <Eye className={styles.actionIcon} />
                  </button>
                  <button
                    type="button"
                    className={styles.actionIconBtn}
                    onClick={() => onEdit(policy)}
                    title="Edit Policy"
                  >
                    <Edit className={styles.actionIcon} />
                  </button>
                  {policy.isActive ? (
                    <div className={styles.actionIconBtn} style={{ visibility: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
                      <CheckCircle className={styles.actionIcon} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.actionIconBtn}
                      onClick={() => onActivate(policy)}
                      title="Activate Policy"
                    >
                      <CheckCircle className={styles.actionIcon} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

