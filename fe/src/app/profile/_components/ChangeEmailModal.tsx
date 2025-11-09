"use client";

import { useState, useEffect } from "react";
import { Mail, X, AlertCircle } from "lucide-react";
import styles from "@/app/profile/styles.module.css";

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSave: (newEmail: string, password: string) => Promise<void>;
}

export default function ChangeEmailModal({
  isOpen,
  onClose,
  currentEmail,
  onSave,
}: ChangeEmailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    newEmail: "",
    confirmEmail: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData({ newEmail: "", confirmEmail: "", password: "" });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.newEmail) {
      newErrors.newEmail = "New email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      newErrors.newEmail = "Invalid email format";
    } else if (formData.newEmail === currentEmail) {
      newErrors.newEmail = "New email must be different from current email";
    }

    if (!formData.confirmEmail) {
      newErrors.confirmEmail = "Please confirm your email";
    } else if (formData.newEmail !== formData.confirmEmail) {
      newErrors.confirmEmail = "Emails do not match";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await onSave(formData.newEmail, formData.password);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error?.message || "Failed to change email" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={onClose} />
      <div className={`${styles["modal-container"]} ${styles["modal-container-md"]}`}>
        <div className={styles["modal-card"]}>
          <div className={styles["modal-header"]}>
            <div className={styles["modal-header-left"]}>
              <div className={`${styles["modal-icon-wrapper"]} ${styles["blue"]}`}>
                <Mail className={`${styles["modal-icon"]} ${styles["blue"]}`} />
              </div>
              <div>
                <h3 className={styles["modal-title"]}>Change Email</h3>
                <p className={styles["modal-subtitle"]}>
                  Update your email address
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={styles["modal-close-btn"]}
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles["modal-form"]}>
            <div className={styles["form-fields"]}>
              <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>Current Email</label>
                <input
                  type="email"
                  value={currentEmail}
                  disabled
                  className={`${styles["field-input"]} ${styles["field-input-sm"]} ${styles["disabled"]}`}
                />
              </div>

              <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>
                  New Email <span className={`${styles["field-label-required"]} ${styles["field-label-required-sm"]}`}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.newEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, newEmail: e.target.value });
                    if (errors.newEmail) setErrors({ ...errors, newEmail: "" });
                  }}
                  placeholder="Enter new email"
                  className={`${styles["field-input"]} ${styles["field-input-sm"]} ${errors.newEmail ? styles.error : ""}`}
                />
                {errors.newEmail && (
                  <div className={`${styles["field-error"]} ${styles["field-error-inline"]}`}>
                    <AlertCircle className={styles["error-icon"]} />
                    {errors.newEmail}
                  </div>
                )}
              </div>

              <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>
                  Confirm New Email <span className={`${styles["field-label-required"]} ${styles["field-label-required-sm"]}`}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.confirmEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmEmail: e.target.value });
                    if (errors.confirmEmail)
                      setErrors({ ...errors, confirmEmail: "" });
                  }}
                  placeholder="Confirm new email"
                  className={`${styles["field-input"]} ${styles["field-input-sm"]} ${errors.confirmEmail ? styles.error : ""}`}
                />
                {errors.confirmEmail && (
                  <div className={`${styles["field-error"]} ${styles["field-error-inline"]}`}>
                    <AlertCircle className={styles["error-icon"]} />
                    {errors.confirmEmail}
                  </div>
                )}
              </div>

              <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>
                  Current Password <span className={`${styles["field-label-required"]} ${styles["field-label-required-sm"]}`}>*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                  placeholder="Enter your password"
                  className={`${styles["field-input"]} ${styles["field-input-sm"]} ${errors.password ? styles.error : ""}`}
                />
                {errors.password && (
                  <div className={`${styles["field-error"]} ${styles["field-error-inline"]}`}>
                    <AlertCircle className={styles["error-icon"]} />
                    {errors.password}
                  </div>
                )}
              </div>

              {errors.submit && (
                <div className={styles["alert-error"]}>
                  <div className={styles["alert-error-content"]}>
                    <AlertCircle className={styles["alert-icon"]} />
                    {errors.submit}
                  </div>
                </div>
              )}
            </div>

            <div className={`${styles["modal-actions"]} ${styles["modal-actions-end"]}`}>
              <button
                type="button"
                onClick={onClose}
                className={`${styles["btn-cancel"]} ${styles["btn-cancel-sm"]}`}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`${styles["btn-submit"]} ${styles["blue"]} ${styles["btn-submit-sm"]}`}
              >
                {isLoading && (
                  <svg className={styles["spinner"]} fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isLoading ? "Changing..." : "Change Email"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

