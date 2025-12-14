"use client";

import { useState, useEffect } from "react";
import { Lock, X, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import styles from "@/app/profile/styles.module.css";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<void>;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onChangePassword,
}: ChangePasswordModalProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
      setShowPasswords({ current: false, new: false, confirm: false });
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = "New password must be different from current";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await onChangePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      onClose();
    } catch (error: any) {
      // Extract error message from various possible locations
      const errorMessage = 
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to change password";
      
      console.log("Change password error:", { error, errorMessage }); // Debug log
      
      // Check if error is related to incorrect current password
      const lowerMessage = errorMessage.toLowerCase();
      const isInvalidCurrentPassword =
        lowerMessage.includes("current password is incorrect") ||
        lowerMessage.includes("invalid_current_password") ||
        (lowerMessage.includes("incorrect") && lowerMessage.includes("current")) ||
        lowerMessage.includes("incorrect password");
      
      if (isInvalidCurrentPassword) {
        // Set error on currentPassword field
        setErrors({ currentPassword: "Incorrect for current Password" });
        // Show toast error
        showToast({
          type: "error",
          title: "Change Password Failed",
          message: "Incorrect for current Password",
          duration: 5000,
        });
      } else {
        // Other errors
        setErrors({ submit: errorMessage });
        showToast({
          type: "error",
          title: "Change Password Failed",
          message: errorMessage,
          duration: 5000,
        });
      }
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
              <div className={`${styles["modal-icon-wrapper"]} ${styles["green"]}`}>
                <Lock className={`${styles["modal-icon"]} ${styles["green"]}`} />
              </div>
              <div>
                <h3 className={styles["modal-title"]}>Change Password</h3>
                <p className={styles["modal-subtitle"]}>
                  Update your account password
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
                <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>
                  Current Password <span className={`${styles["field-label-required"]} ${styles["field-label-required-sm"]}`}>*</span>
                </label>
                <div className={styles["field-input-wrapper"]}>
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      });
                      if (errors.currentPassword)
                        setErrors({ ...errors, currentPassword: "" });
                    }}
                    placeholder="Enter current password"
                    className={`${styles["field-input"]} ${styles["field-input-sm"]} ${styles["with-toggle"]} ${errors.currentPassword ? styles.error : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        current: !showPasswords.current,
                      })
                    }
                    className={styles["field-toggle-btn"]}
                  >
                    {showPasswords.current ? (
                      <EyeOff className={styles["field-toggle-icon"]} />
                    ) : (
                      <Eye className={styles["field-toggle-icon"]} />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <div className={`${styles["field-error"]} ${styles["field-error-inline"]}`}>
                    <AlertCircle className={styles["error-icon"]} />
                    {errors.currentPassword}
                  </div>
                )}
              </div>

              <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>
                  New Password <span className={`${styles["field-label-required"]} ${styles["field-label-required-sm"]}`}>*</span>
                </label>
                <div className={styles["field-input-wrapper"]}>
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, newPassword: e.target.value });
                      if (errors.newPassword)
                        setErrors({ ...errors, newPassword: "" });
                    }}
                    placeholder="Enter new password (min. 8 characters)"
                    className={`${styles["field-input"]} ${styles["field-input-sm"]} ${styles["with-toggle"]} ${errors.newPassword ? styles.error : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new,
                      })
                    }
                    className={styles["field-toggle-btn"]}
                  >
                    {showPasswords.new ? (
                      <EyeOff className={styles["field-toggle-icon"]} />
                    ) : (
                      <Eye className={styles["field-toggle-icon"]} />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <div className={`${styles["field-error"]} ${styles["field-error-inline"]}`}>
                    <AlertCircle className={styles["error-icon"]} />
                    {errors.newPassword}
                  </div>
                )}
              </div>

              <div className={`${styles["field-group"]} ${styles["space-y"]}`}>
                <label className={`${styles["field-label"]} ${styles["field-label-sm"]}`}>
                  Confirm New Password <span className={`${styles["field-label-required"]} ${styles["field-label-required-sm"]}`}>*</span>
                </label>
                <div className={styles["field-input-wrapper"]}>
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      });
                      if (errors.confirmPassword)
                        setErrors({ ...errors, confirmPassword: "" });
                    }}
                    placeholder="Confirm new password"
                    className={`${styles["field-input"]} ${styles["field-input-sm"]} ${styles["with-toggle"]} ${errors.confirmPassword ? styles.error : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm,
                      })
                    }
                    className={styles["field-toggle-btn"]}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className={styles["field-toggle-icon"]} />
                    ) : (
                      <Eye className={styles["field-toggle-icon"]} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className={`${styles["field-error"]} ${styles["field-error-inline"]}`}>
                    <AlertCircle className={styles["error-icon"]} />
                    {errors.confirmPassword}
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
                className={`${styles["btn-submit"]} ${styles["green"]} ${styles["btn-submit-sm"]}`}
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
                {isLoading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

