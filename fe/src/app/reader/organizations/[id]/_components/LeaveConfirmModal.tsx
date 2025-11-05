"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
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
  const [password, setPassword] = useState<string>("");
  const [leaving, setLeaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setError(null);
    setLeaving(true);
    try {
      await leaveOrganization(orgId, password);
      showToast({
        type: "success",
        title: "Left Organization",
        message: `You have successfully left ${orgName}`,
        duration: 3000,
      });
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Failed to leave organization");
      showToast({
        type: "error",
        title: "Failed to Leave",
        message: e?.message || "Failed to leave organization. Please try again.",
        duration: 5000,
      });
    } finally {
      setLeaving(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError(null);
    onClose();
  };

  if (!open) return null;

  return createPortal(
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

        <div className="mb-4">
          <label className={styles["modal-label"]}>
            Enter your password to confirm
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Password"
            className={styles["modal-input"]}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
          />
          {error && (
            <div className={styles["modal-error"]}>{error}</div>
          )}
        </div>

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
            disabled={leaving || !password}
            className={styles["btn-submit"]}
          >
            {leaving ? "Leaving..." : "Leave Organization"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

