"use client";

import { useState, useEffect } from "react";
import { User, X, AlertCircle, Calendar } from "lucide-react";
import type { ProfileResponse } from "@/services/profile.service";
import styles from "@/app/profile/styles.module.css";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileResponse | null;
  onSave: (data: Partial<ProfileResponse>) => Promise<void>;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: EditProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    dateOfBirth: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && profile) {
      // Convert ISO date to YYYY-MM-DD format for input
      let dateOfBirth = "";
      if (profile.dateOfBirth) {
        try {
          const date = new Date(profile.dateOfBirth);
          dateOfBirth = date.toISOString().split("T")[0];
        } catch {
          dateOfBirth = "";
        }
      }

      setFormData({
        fullName: profile.fullName || "",
        username: profile.username || "",
        dateOfBirth: dateOfBirth,
      });
      setErrors({});
    }
  }, [isOpen, profile]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.trim() === "") {
      newErrors.fullName = "Full name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const updateData: Partial<ProfileResponse> = {
        fullName: formData.fullName.trim(),
      };
      if (formData.username) {
        updateData.username = formData.username.trim();
      }
      if (formData.dateOfBirth) {
        // Convert YYYY-MM-DD to ISO string
        updateData.dateOfBirth = new Date(formData.dateOfBirth).toISOString();
      }
      await onSave(updateData);
      onClose();
    } catch (error: any) {
      setErrors({ submit: error?.message || "Failed to update profile" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen || !profile) return null;

  // Only allow READER and REVIEWER to edit profile
  if (profile.role !== "READER" && profile.role !== "REVIEWER") {
    return null;
  }

  return (
    <div className={`${styles["modal-overlay"]} ${styles["with-padding"]}`}>
      <div className={styles["modal-backdrop"]} onClick={onClose} />
      <div
        className={`${styles["modal-container"]} ${styles["modal-container-lg"]}`}
      >
        <div className={`${styles["modal-card"]} ${styles["modal-card-flex"]}`}>
          <div className={styles["modal-header"]}>
            <div className={styles["modal-header-left"]}>
              <div
                className={`${styles["modal-icon-wrapper"]} ${styles["primary"]}`}
              >
                <User
                  className={`${styles["modal-icon"]} ${styles["primary"]}`}
                />
              </div>
              <div>
                <h3 className={styles["modal-title"]}>Edit Profile</h3>
                <p className={styles["modal-subtitle"]}>
                  Update your profile information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={styles["modal-close-btn"]}
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className={`${styles["modal-form"]} ${styles["with-scroll"]}`}
          >
            <div className={styles["field-group"]}>
              <label className={styles["field-label"]}>
                Full Name{" "}
                <span className={styles["field-label-required"]}>*</span>
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  if (errors.fullName) setErrors({ ...errors, fullName: "" });
                }}
                className={`${styles["field-input"]} ${errors.fullName ? styles.error : ""}`}
                required
              />
              {errors.fullName && (
                <p className={styles["field-error"]}>{errors.fullName}</p>
              )}
            </div>

            <div className={styles["field-group"]}>
              <label className={styles["field-label"]}>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  if (errors.username) setErrors({ ...errors, username: "" });
                }}
                className={`${styles["field-input"]} ${errors.username ? styles.error : ""}`}
              />
              {errors.username && (
                <p className={styles["field-error"]}>{errors.username}</p>
              )}
            </div>

            <div className={styles["field-group"]}>
              <label className={styles["field-label"]}>Date of Birth</label>
              <div className={styles["field-icon-wrapper"]}>
                <div className={styles["field-icon"]}>
                  <Calendar className="h-5 w-5 text-dark-6 dark:text-dark-7" />
                </div>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => {
                    setFormData({ ...formData, dateOfBirth: e.target.value });
                    if (errors.dateOfBirth)
                      setErrors({ ...errors, dateOfBirth: "" });
                  }}
                  className={`${styles["field-input"]} ${styles["date-input"]} ${errors.dateOfBirth ? styles.error : ""}`}
                />
              </div>
              {errors.dateOfBirth && (
                <p className={styles["field-error"]}>{errors.dateOfBirth}</p>
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

            <div className={styles["modal-actions"]}>
              <button
                type="button"
                onClick={onClose}
                className={styles["btn-cancel"]}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={styles["btn-submit"]}
              >
                {isLoading && (
                  <svg
                    className={styles["spinner"]}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
