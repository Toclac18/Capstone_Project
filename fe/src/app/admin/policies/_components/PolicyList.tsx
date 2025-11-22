"use client";

import { Eye, Edit } from "lucide-react";
import type { Policy } from "@/types/policy";
import { PolicyType, PolicyStatus } from "@/types/policy";
import styles from "./styles.module.css";

interface PolicyListProps {
  policies: Policy[];
  loading: boolean;
  onView: (policy: Policy) => void;
  onEdit: (policy: Policy) => void;
  onStatusChange: (policy: Policy, newStatus: PolicyStatus) => void;
}

const TYPE_LABELS: Record<string, string> = {
  TERMS_OF_SERVICE: "Terms of Service",
  PRIVACY_POLICY: "Privacy Policy",
  COOKIE_POLICY: "Cookie Policy",
  ACCEPTABLE_USE: "Acceptable Use",
  REFUND_POLICY: "Refund Policy",
  COPYRIGHT_POLICY: "Copyright Policy",
  COMMUNITY_GUIDELINES: "Community Guidelines",
};

export function PolicyList({
  policies,
  loading,
  onView,
  onEdit,
  onStatusChange,
}: PolicyListProps) {
  const getTypeLabel = (type: PolicyType | string) => {
    return TYPE_LABELS[type] || type;
  };

  const getStatusLabel = (status: PolicyStatus | string) => {
    return status === PolicyStatus.ACTIVE ? "Active" : "Inactive";
  };

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
          <p>No policies found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Title</th>
            <th>Status</th>
            <th>Required</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy) => (
            <tr key={policy.id}>
              <td>
                <span className={styles.type}>{getTypeLabel(policy.type)}</span>
              </td>
              <td>
                <div className={styles.titleCell}>
                  <span className={styles.title}>{policy.title}</span>
                </div>
              </td>
              <td>
                <select
                  value={policy.status}
                  onChange={(e) => onStatusChange(policy, e.target.value as PolicyStatus)}
                  className={styles.statusSelect}
                  title="Change policy status"
                >
                  <option value={PolicyStatus.ACTIVE}>Active</option>
                  <option value={PolicyStatus.INACTIVE}>Inactive</option>
                </select>
              </td>
              <td>
                {policy.isRequired ? (
                  <span className={styles.required}>Yes</span>
                ) : (
                  <span className={styles.optional}>No</span>
                )}
              </td>
              <td>
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

