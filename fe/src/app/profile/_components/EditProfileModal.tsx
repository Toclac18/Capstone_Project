"use client";

import { useState, useEffect } from "react";
import { User, X, AlertCircle, Calendar, Hash, Building2, Mail, Phone, MapPin } from "lucide-react";
import type { 
  ProfileResponse,
  ReaderProfileResponse,
  ReviewerProfileResponse,
  OrganizationProfileResponse,
} from "@/services/profile.service";
import styles from "@/app/profile/styles.module.css";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileResponse | null;
  onSave: (data: Partial<ReaderProfileResponse | ReviewerProfileResponse | OrganizationProfileResponse>) => Promise<void>;
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
      } else if (profile.role === "ORGANIZATION_ADMIN") {
        const orgProfile = profile as OrganizationProfileResponse & { role: "ORGANIZATION_ADMIN" };
        setFormData({
          fullName: orgProfile.fullName || "",
          dateOfBirth: "",
          ordid: "",
          educationLevel: "",
          organizationName: "",
          organizationEmail: "",
          name: orgProfile.orgName || "",
          type: orgProfile.orgType || "",
          email: orgProfile.orgEmail || "",
          hotline: orgProfile.orgHotline || "",
          address: orgProfile.orgAddress || "",
          registrationNumber: orgProfile.orgRegistrationNumber || "",
        });
      }
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
      } else if (profile?.role === "ORGANIZATION_ADMIN") {
        const updateData: Partial<OrganizationProfileResponse> = {
          fullName: formData.fullName.trim(),
        };
        if (formData.name) {
          updateData.name = formData.name.trim();
        }
        if (formData.type) {
          updateData.type = formData.type as any;
        }
        if (formData.email) {
          updateData.email = formData.email.trim();
        }
        if (formData.hotline) {
          updateData.hotline = formData.hotline.trim();
        }
        if (formData.address) {
          updateData.address = formData.address.trim();
        }
        if (formData.registrationNumber) {
          updateData.registrationNumber = formData.registrationNumber.trim();
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

  // Only allow READER, REVIEWER, and ORGANIZATION_ADMIN to edit profile
  if (profile.role !== "READER" && profile.role !== "REVIEWER" && profile.role !== "ORGANIZATION_ADMIN") {
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

            {(profile.role === "READER" || profile.role === "REVIEWER") && (
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
            )}

            {/* Reviewer specific fields */}
            {profile.role === "REVIEWER" && (
              <>
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>ORCID</label>
                  <div className={styles["field-icon-wrapper"]}>
                    <div className={styles["field-icon"]}>
                      <Hash className="h-5 w-5 text-dark-6 dark:text-dark-7" />
                    </div>
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
                    />
                  </div>
                  {errors.ordid && (
                    <p className={styles["field-error"]}>{errors.ordid}</p>
                  )}
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>Education Level</label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={(e) => {
                      setFormData({ ...formData, educationLevel: e.target.value });
                      if (errors.educationLevel) setErrors({ ...errors, educationLevel: "" });
                    }}
                    className={`${styles["field-input"]} ${errors.educationLevel ? styles.error : ""}`}
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
                  <label className={styles["field-label"]}>Organization Name</label>
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
                  />
                  {errors.organizationName && (
                    <p className={styles["field-error"]}>{errors.organizationName}</p>
                  )}
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>Organization Email</label>
                  <div className={styles["field-icon-wrapper"]}>
                    <div className={styles["field-icon"]}>
                      <Mail className="h-5 w-5 text-dark-6 dark:text-dark-7" />
                    </div>
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
                    />
                  </div>
                  {errors.organizationEmail && (
                    <p className={styles["field-error"]}>{errors.organizationEmail}</p>
                  )}
                </div>
              </>
            )}

            {/* Organization Admin specific fields */}
            {profile.role === "ORGANIZATION_ADMIN" && (
              <>
                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>
                    Organization Name{" "}
                    <span className={styles["field-label-required"]}>*</span>
                  </label>
                  <div className={styles["field-icon-wrapper"]}>
                    <div className={styles["field-icon"]}>
                      <Building2 className="h-5 w-5 text-dark-6 dark:text-dark-7" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter organization name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      className={`${styles["field-input"]} ${errors.name ? styles.error : ""}`}
                      required
                    />
                  </div>
                  {errors.name && (
                    <p className={styles["field-error"]}>{errors.name}</p>
                  )}
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>Organization Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({ ...formData, type: e.target.value });
                      if (errors.type) setErrors({ ...errors, type: "" });
                    }}
                    className={`${styles["field-input"]} ${errors.type ? styles.error : ""}`}
                  >
                    <option value="">Select organization type</option>
                    <option value="SCHOOL">School</option>
                    <option value="COLLEGE">College</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="TRAINING_CENTER">Training Center</option>
                  </select>
                  {errors.type && (
                    <p className={styles["field-error"]}>{errors.type}</p>
                  )}
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>Organization Email</label>
                  <div className={styles["field-icon-wrapper"]}>
                    <div className={styles["field-icon"]}>
                      <Mail className="h-5 w-5 text-dark-6 dark:text-dark-7" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="org@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                      className={`${styles["field-input"]} ${errors.email ? styles.error : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className={styles["field-error"]}>{errors.email}</p>
                  )}
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>Hotline</label>
                  <div className={styles["field-icon-wrapper"]}>
                    <div className={styles["field-icon"]}>
                      <Phone className="h-5 w-5 text-dark-6 dark:text-dark-7" />
                    </div>
                    <input
                      type="tel"
                      name="hotline"
                      placeholder="+84 123 456 789"
                      value={formData.hotline}
                      onChange={(e) => {
                        setFormData({ ...formData, hotline: e.target.value });
                        if (errors.hotline) setErrors({ ...errors, hotline: "" });
                      }}
                      className={`${styles["field-input"]} ${errors.hotline ? styles.error : ""}`}
                    />
                  </div>
                  {errors.hotline && (
                    <p className={styles["field-error"]}>{errors.hotline}</p>
                  )}
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>Address</label>
                  <div className={styles["field-icon-wrapper"]}>
                    <div className={styles["field-icon"]}>
                      <MapPin className="h-5 w-5 text-dark-6 dark:text-dark-7" />
                    </div>
                    <input
                      type="text"
                      name="address"
                      placeholder="Enter organization address"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (errors.address) setErrors({ ...errors, address: "" });
                      }}
                      className={`${styles["field-input"]} ${errors.address ? styles.error : ""}`}
                    />
                  </div>
                  {errors.address && (
                    <p className={styles["field-error"]}>{errors.address}</p>
                  )}
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["field-label"]}>Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    placeholder="Enter registration number"
                    value={formData.registrationNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, registrationNumber: e.target.value });
                      if (errors.registrationNumber) setErrors({ ...errors, registrationNumber: "" });
                    }}
                    className={`${styles["field-input"]} ${errors.registrationNumber ? styles.error : ""}`}
                  />
                  {errors.registrationNumber && (
                    <p className={styles["field-error"]}>{errors.registrationNumber}</p>
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
