"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Building2, X, AlertCircle, Upload } from "lucide-react";
import type { OrganizationInfo, UpdateOrganizationData } from "../api";
import styles from "../styles.module.css";

// Constants
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ORGANIZATION_TYPES = [
  { value: "NON-PROFIT", label: "Non-Profit" },
  { value: "FOR-PROFIT", label: "For-Profit" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "EDUCATIONAL", label: "Educational" },
  { value: "OTHER", label: "Other" },
] as const;

// Helper function to render spinner
const Spinner = () => (
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
);

interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationInfo | null;
  onSave: (data: UpdateOrganizationData) => Promise<void>;
}

export default function EditOrganizationModal({
  isOpen,
  onClose,
  organization,
  onSave,
}: EditOrganizationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    email: "",
    registrationNumber: "",
    certificateFile: null as File | null,
    certificateFileName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && organization) {
      setFormData({
        name: organization.name || "",
        type: organization.type || "",
        email: organization.email || "",
        registrationNumber: organization.registrationNumber || "",
        certificateFile: null,
        certificateFileName: organization.certificateUpload
          ? organization.certificateUpload.split("/").pop() || ""
          : "",
      });
      setErrors({});
    }
  }, [isOpen, organization]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = "Organization name is required";
    }

    const trimmedType = formData.type.trim();
    if (!trimmedType) {
      newErrors.type = "Organization type is required";
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = "Organization email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Invalid email format";
    }

    const trimmedRegNumber = formData.registrationNumber.trim();
    if (!trimmedRegNumber) {
      newErrors.registrationNumber = "Registration number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
      setErrors({
        ...errors,
        certificateFile: "Please upload a PDF or Word document",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrors({
        ...errors,
        certificateFile: "File size must be less than 10MB",
      });
      return;
    }

    // Clear error if exists
    const newErrors = { ...errors };
    if (newErrors.certificateFile) {
      delete newErrors.certificateFile;
    }

    setFormData({
      ...formData,
      certificateFile: file,
      certificateFileName: file.name,
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await onSave({
        name: formData.name.trim(),
        type: formData.type.trim(),
        email: formData.email.trim(),
        registrationNumber: formData.registrationNumber.trim(),
        certificateUpload: formData.certificateFile,
      });
      onClose();
    } catch (error: any) {
      setErrors({ submit: error?.message || "Failed to update organization" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !isOpen || !organization) return null;

  return createPortal(
    <div className={styles["modal-overlay"]}>
      <div className={styles["modal-backdrop"]} onClick={onClose} />
      <div className={`${styles["modal-container"]} ${styles["modal-container-lg"]}`}>
        <div className={`${styles["modal-card"]} ${styles["modal-card-flex"]}`}>
          <div className={styles["modal-header"]}>
            <div className={styles["modal-header-left"]}>
              <div className={`${styles["modal-icon-wrapper"]} ${styles["primary"]}`}>
                <Building2 className={`${styles["modal-icon"]} ${styles["primary"]}`} />
              </div>
              <div>
                <h3 className={styles["modal-title"]}>Update Organization</h3>
                <p className={styles["modal-subtitle"]}>
                  Update your organization information
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
            <div className={styles["field-group"]}>
              <label className={styles["field-label"]}>
                Organization Name <span className={styles["field-label-required"]}>*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter organization name"
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, name: value });
                  if (errors.name) {
                    setErrors({ ...errors, name: "" });
                  }
                }}
                className={`${styles["field-input"]} ${errors.name ? styles["error"] : ""}`}
                required
              />
              {errors.name && (
                <p className={styles["field-error"]}>{errors.name}</p>
              )}
            </div>

            <div className={styles["field-group"]}>
              <label className={styles["field-label"]}>
                Organization Type <span className={styles["field-label-required"]}>*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, type: value });
                  if (errors.type) {
                    setErrors({ ...errors, type: "" });
                  }
                }}
                className={`${styles["field-input"]} ${styles["field-select"]} ${errors.type ? styles["error"] : ""}`}
                required
              >
                <option value="">Select organization type</option>
                {ORGANIZATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className={styles["field-error"]}>{errors.type}</p>
              )}
            </div>

            <div className={styles["field-group"]}>
              <label className={styles["field-label"]}>
                Organization Email <span className={styles["field-label-required"]}>*</span>
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter organization email"
                value={formData.email}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, email: value });
                  if (errors.email) {
                    setErrors({ ...errors, email: "" });
                  }
                }}
                className={`${styles["field-input"]} ${errors.email ? styles["error"] : ""}`}
                required
              />
              {errors.email && (
                <p className={styles["field-error"]}>{errors.email}</p>
              )}
            </div>

            <div className={styles["field-group"]}>
              <label className={styles["field-label"]}>
                Registration Number <span className={styles["field-label-required"]}>*</span>
              </label>
              <input
                type="text"
                name="registrationNumber"
                placeholder="Enter registration number"
                value={formData.registrationNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, registrationNumber: value });
                  if (errors.registrationNumber) {
                    setErrors({ ...errors, registrationNumber: "" });
                  }
                }}
                className={`${styles["field-input"]} ${errors.registrationNumber ? styles["error"] : ""}`}
                required
              />
              {errors.registrationNumber && (
                <p className={styles["field-error"]}>{errors.registrationNumber}</p>
              )}
            </div>

            <div className={styles["field-group"]}>
              <label className={styles["field-label"]}>
                Organization Certificate Upload
              </label>
              <div className={styles["file-upload-wrapper"]}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className={styles["file-input"]}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={styles["btn-upload"]}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                {formData.certificateFileName && (
                  <span className={styles["file-name"]}>
                    {formData.certificateFileName}
                  </span>
                )}
              </div>
              {errors.certificateFile && (
                <p className={styles["field-error"]}>{errors.certificateFile}</p>
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

            <div className={`${styles["modal-actions"]} ${styles["modal-actions-end"]}`}>
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
                {isLoading && <Spinner />}
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

