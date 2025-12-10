"use client";

import { useState, useEffect } from "react";
import { User, X, AlertCircle } from "lucide-react";
import type { 
  ProfileResponse,
  ReaderProfileResponse,
  ReviewerProfileResponse,
} from "@/services/profile.service";
import styles from "@/app/profile/styles.module.css";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileResponse | null;
  onSave: (data: Partial<ReaderProfileResponse | ReviewerProfileResponse >) => Promise<void>;
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
    dateOfBirth: "",
    // Reviewer fields
    ordid: "",
    educationLevel: "",
    organizationName: "",
    organizationEmail: "",
    // Organization fields
    name: "",
    type: "",
    email: "",
    hotline: "",
    address: "",
    registrationNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && profile) {
      let dateOfBirth = "";
      
      // Handle date of birth based on role
      if (profile.role === "READER") {
        const readerProfile = profile as ReaderProfileResponse & { role: "READER" };
        if (readerProfile.dob) {
          try {
            dateOfBirth = readerProfile.dob.split("T")[0]; // LocalDate format: YYYY-MM-DD
          } catch {
            dateOfBirth = "";
          }
        }
      } else if (profile.role === "REVIEWER") {
        const reviewerProfile = profile as ReviewerProfileResponse & { role: "REVIEWER" };
        if (reviewerProfile.dateOfBirth) {
          try {
            dateOfBirth = reviewerProfile.dateOfBirth.split("T")[0];
          } catch {
            dateOfBirth = "";
          }
        }
      }

      if (profile.role === "READER") {
        const readerProfile = profile as ReaderProfileResponse & { role: "READER" };
        setFormData({
          fullName: readerProfile.fullName || "",
          dateOfBirth,
          ordid: "",
          educationLevel: "",
          organizationName: "",
          organizationEmail: "",
          name: "",
          type: "",
          email: "",
          hotline: "",
          address: "",
          registrationNumber: "",
        });
      } else if (profile.role === "REVIEWER") {
        const reviewerProfile = profile as ReviewerProfileResponse & { role: "REVIEWER" };
        setFormData({
          fullName: reviewerProfile.fullName || "",
          dateOfBirth,
          ordid: reviewerProfile.ordid || "",
          educationLevel: reviewerProfile.educationLevel || "",
          organizationName: reviewerProfile.organizationName || "",
          organizationEmail: reviewerProfile.organizationEmail || "",
          name: "",
          type: "",
          email: "",
          hotline: "",
          address: "",
          registrationNumber: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, profile]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name is required
    if (!formData.fullName || formData.fullName.trim() === "") {
      newErrors.fullName = "Full name is required";
    }

    // Date of Birth is required
    if (!formData.dateOfBirth || formData.dateOfBirth.trim() === "") {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      // Validate date of birth: age must be between 18 and 80 years old
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old";
      } else if (age > 80) {
        newErrors.dateOfBirth = "You must be at most 80 years old";
      }
    }

    // Reviewer specific fields validation
    if (profile?.role === "REVIEWER") {
      if (!formData.ordid || formData.ordid.trim() === "") {
        newErrors.ordid = "ORCID is required";
      }

      if (!formData.educationLevel || formData.educationLevel.trim() === "") {
        newErrors.educationLevel = "Education level is required";
      }

      if (!formData.organizationName || formData.organizationName.trim() === "") {
        newErrors.organizationName = "Organization name is required";
      }

      if (!formData.organizationEmail || formData.organizationEmail.trim() === "") {
        newErrors.organizationEmail = "Organization email is required";
      } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.organizationEmail.trim())) {
          newErrors.organizationEmail = "Invalid email format";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      if (profile?.role === "READER") {
        const updateData: Partial<ReaderProfileResponse> = {
          fullName: formData.fullName.trim(),
        };
        if (formData.dateOfBirth) {
          updateData.dob = formData.dateOfBirth; // LocalDate format: YYYY-MM-DD
        }
        await onSave(updateData);
      } else if (profile?.role === "REVIEWER") {
        const updateData: Partial<ReviewerProfileResponse> = {
          fullName: formData.fullName.trim(),
        };
        if (formData.dateOfBirth) {
          updateData.dateOfBirth = formData.dateOfBirth;
        }
        if (formData.ordid) {
          updateData.ordid = formData.ordid.trim();
        }
        if (formData.educationLevel) {
          updateData.educationLevel = formData.educationLevel as any;
        }
        if (formData.organizationName) {
          updateData.organizationName = formData.organizationName.trim();
        }
        if (formData.organizationEmail) {
          updateData.organizationEmail = formData.organizationEmail.trim();
        }
        await onSave(updateData);
      } 
      
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
                <h3 className={styles["modal-title"]}>Change Profile</h3>
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

            {(profile.role === "READER" || profile.role === "REVIEWER") && (
              <div className={styles["field-group"]}>
                <label className={styles["field-label"]}>
                  Date of Birth{" "}
                  <span className={styles["field-label-required"]}>*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={(e) => {
                    setFormData({ ...formData, dateOfBirth: e.target.value });
                    if (errors.dateOfBirth)
                      setErrors({ ...errors, dateOfBirth: "" });
                  }}
                  className={`${styles["field-input"]} ${errors.dateOfBirth ? styles.error : ""}`}
                  required
                />
                {errors.dateOfBirth && (
                  <p className={styles["field-error"]}>{errors.dateOfBirth}</p>
                )}
              </div>
            )}

            {/* Reviewer specific fields */}
            {profile.role === "REVIEWER" && (
              <>
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    ORCID{" "}
                    <span className={styles["field-label-required"]}>*</span>
                  </label>
                  <input
                    type="text"
                    name="ordid"
                    placeholder="0000-0000-0000-0000"
                    value={formData.ordid}
                    onChange={(e) => {
                      setFormData({ ...formData, ordid: e.target.value });
                      if (errors.ordid) setErrors({ ...errors, ordid: "" });
                    }}
                    className={`${styles["field-input"]} ${errors.ordid ? styles.error : ""}`}
                    required
                  />
                  {errors.ordid && (
                    <p className={styles["field-error"]}>{errors.ordid}</p>
                  )}
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    Education Level{" "}
                    <span className={styles["field-label-required"]}>*</span>
                  </label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={(e) => {
                      setFormData({ ...formData, educationLevel: e.target.value });
                      if (errors.educationLevel) setErrors({ ...errors, educationLevel: "" });
                    }}
                    className={`${styles["field-input"]} ${errors.educationLevel ? styles.error : ""}`}
                    required
                  >
                    <option value="">Select education level</option>
                    <option value="BACHELOR">Bachelor</option>
                    <option value="MASTER">Master</option>
                    <option value="DOCTORATE">Doctorate</option>
                  </select>
                  {errors.educationLevel && (
                    <p className={styles["field-error"]}>{errors.educationLevel}</p>
                  )}
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    Organization Name{" "}
                    <span className={styles["field-label-required"]}>*</span>
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    placeholder="Enter organization name"
                    value={formData.organizationName}
                    onChange={(e) => {
                      setFormData({ ...formData, organizationName: e.target.value });
                      if (errors.organizationName) setErrors({ ...errors, organizationName: "" });
                    }}
                    className={`${styles["field-input"]} ${errors.organizationName ? styles.error : ""}`}
                    required
                  />
                  {errors.organizationName && (
                    <p className={styles["field-error"]}>{errors.organizationName}</p>
                  )}
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    Organization Email{" "}
                    <span className={styles["field-label-required"]}>*</span>
                  </label>
                  <input
                    type="email"
                    name="organizationEmail"
                    placeholder="org@example.com"
                    value={formData.organizationEmail}
                    onChange={(e) => {
                      setFormData({ ...formData, organizationEmail: e.target.value });
                      if (errors.organizationEmail) setErrors({ ...errors, organizationEmail: "" });
                    }}
                    className={`${styles["field-input"]} ${errors.organizationEmail ? styles.error : ""}`}
                    required
                  />
                  {errors.organizationEmail && (
                    <p className={styles["field-error"]}>{errors.organizationEmail}</p>
                  )}
                </div>
              </>
            )}            

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
