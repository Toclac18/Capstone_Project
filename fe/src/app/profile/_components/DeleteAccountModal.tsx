"use client";

import { useState, useEffect } from "react";
import { Trash2, X, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import styles from "@/app/profile/styles.module.css";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (password: string) => Promise<void>;
  email: string;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onDelete,
  email,
}: DeleteAccountModalProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData({ password: "" });
      setErrors({});
      setShowPassword(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password || formData.password.trim() === "") {
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
      await onDelete(formData.password);
      onClose();
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to delete account";
      setErrors({ submit: errorMessage });
      // Show toast error
      showToast({
        type: "error",
        title: "Delete Account Failed",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={onClose} />
      <div className={`${styles["modal-container"]} ${styles["modal-container-md"]}`}>
        <div className={`${styles["modal-card"]} ${styles["red-border"]}`}>
          <div className={`${styles["modal-header"]} ${styles["red-border"]}`}>
            <div className={styles["modal-header-left"]}>
              <div className={`${styles["modal-icon-wrapper"]} ${styles["red"]}`}>
                <Trash2 className={`${styles["modal-icon"]} ${styles["red"]}`} />
              </div>
              <div>
                <h3 className={`${styles["modal-title"]} ${styles["red"]}`}>Delete Account</h3>
                <p className={styles["modal-subtitle"]}>
                  This action cannot be undone
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
              <div className={styles["warning-alert"]}>
                <div className={styles["warning-content"]}>
                  <AlertCircle className={styles["warning-icon"]} />
                  <div>
                    <p className={styles["warning-title"]}>
                      Warning: This will permanently delete your account
                    </p>
                    <ul className={styles["warning-list"]}>
                      <li>All your data will be permanently deleted</li>
                      <li>You will lose access to all your content</li>
                      <li>You must contact admin to restore your account</li>
                      <li>Your documents will be owned by system</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>Account Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className={`${styles["field-input"]} ${styles["field-input-sm"]} ${styles["disabled"]}`}
                />
              </div>

              <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>
                  Enter your password to confirm <span className={`${styles["field-label-required"]} ${styles["field-label-required-sm"]}`}>*</span>
                </label>
                <div className={styles["field-icon-wrapper"]}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password)
                        setErrors({ ...errors, password: "" });
                    }}
                    placeholder="Enter your password"
                    className={`${styles["field-input"]} ${styles["field-input-sm"]} ${errors.password ? styles.error : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles["field-toggle-btn"]}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className={styles["field-toggle-icon"]} />
                    ) : (
                      <Eye className={styles["field-toggle-icon"]} />
                    )}
                  </button>
                </div>
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

            <div className={`${styles["modal-actions"]} ${styles["modal-actions-end"]} ${styles["red-border"]}`}>
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
                className={`${styles["btn-submit"]} ${styles["red"]} ${styles["btn-submit-sm"]}`}
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
                <Trash2 className="w-4 h-4" />
                {isLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

