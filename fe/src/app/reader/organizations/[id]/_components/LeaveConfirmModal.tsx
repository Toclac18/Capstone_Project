"use client";

import { useState } from "react";
import { leaveOrganization } from "../../api";
import { useToast } from "@/components/ui/toast";
import styles from "../../styles.module.css";

type Props = {
  orgId: string;
  orgName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function LeaveConfirmModal({
  orgId,
  orgName,
  open,
  onClose,
  onSuccess,
}: Props) {
  const { showToast } = useToast();
  const [leaving, setLeaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLeaving(true);
    try {
      await leaveOrganization(orgId);
      showToast({
        type: "success",
        title: "Left Organization",
        message: `You have successfully left ${orgName}`,
        duration: 3000,
      });
      // Wait 1.5 seconds before navigating
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (e: any) {
      setError(e?.message || "Failed to leave organization");
      showToast({
        type: "error",
        title: "Failed to Leave",
        message: e?.message || "Failed to leave organization. Please try again.",
        duration: 5000,
      });
      setLeaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={handleClose} />
      <div className={styles["modal-container"]}>
        <div className="mb-4">
          <h3 className={styles["modal-title"]}>
            Leave Organization
          </h3>
          <p className={styles["modal-description"]}>
            Are you sure you want to leave <strong>{orgName}</strong>? This
            action cannot be undone.
          </p>
        </div>

        {error && (
          <div className={`mb-4 ${styles["modal-error"]}`}>{error}</div>
        )}

        <div className={styles["modal-actions"]}>
          <button
            onClick={handleClose}
            disabled={leaving}
            className={styles["btn-cancel"]}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={leaving}
            className={styles["btn-submit"]}
          >
            {leaving ? "Leaving..." : "Leave Organization"}
          </button>
        </div>
      </div>
    </div>
  );
}

