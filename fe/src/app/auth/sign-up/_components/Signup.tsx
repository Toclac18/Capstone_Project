"use client";
import Link from "next/link";
import { EmailIcon, PasswordIcon, UserIcon } from "@/assets/icons";
import React, { useState, useCallback } from "react";
import InputGroup from "@/components/(template)/FormElements/InputGroup";
import Logo from "@/assets/logos/logo-icon.svg";
import LogoDark from "@/assets/logos/logo-icon-dark.svg";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";
import PolicyViewer from "@/components/PolicyViewer/PolicyViewer";
import {
  registerReader,
  registerReviewer,
  registerOrgAdmin,
  type RegisterReaderPayload,
  type RegisterReviewerPayload,
  type RegisterOrgAdminPayload,
} from "../api";
import styles from "../styles.module.css";
import {
  getDomains,
  getSpecializations,
} from "@/services/upload-documents.service";
import {
  validateField as validateFieldHelper,
  getFieldsToValidate,
  validateFileSize,
  validateFileUploadRequired,
} from "./useSignupValidation";

type UserType = "reader" | "reviewer" | "org-admin";

// Constants
const EDUCATION_LEVELS = [
  { value: "", label: "Select education level" },
  { value: "COLLEGE", label: "College" },
  { value: "UNIVERSITY", label: "University" },
  { value: "MASTER", label: "Master's Degree" },
  { value: "DOCTORATE", label: "Doctorate" },
] as const;

const ORGANIZATION_TYPES = [
  { value: "", label: "Select organization type" },
  { value: "SCHOOL", label: "School" },
  { value: "COLLEGE", label: "College" },
  { value: "UNIVERSITY", label: "University" },
  { value: "TRAINING_CENTER", label: "Training Center" },
] as const;

const SUCCESS_MESSAGES = {
  reader: "Please check your email to verify your account.",
  reviewer: "Please check your email to verify your account.",
  "org-admin": "Admin will verify your information.",
} as const;

const VALIDATION_MESSAGES = {
  error: {
    title: "Validation Error",
    message: "Please correct the highlighted fields",
  },
  success: {
    title: "Registration Successful",
  },
  failed: {
    title: "Registration Failed",
    message: "Registration failed",
  },
  loadFailed: {
    title: "Error",
    message: "Failed to load options",
  },
} as const;

type BaseFormData = {
  name: string;
  date_of_birth: string;
  email: string;
  password: string;
  repassword: string;
};

type ReviewerFormData = BaseFormData & {
  orcid?: string;
  educationLevel: string;
  domainIds: string[];
  specializationIds: string[];
  organizationName: string;
  organizationEmail: string;
};

type OrgAdminFormData = {
  adminEmail: string;
  password: string;
  repassword: string;
  adminFullName: string;
  organizationName: string;
  organizationType: string;
  organizationEmail: string;
  hotline: string;
  address: string;
  registrationNumber: string;
};

type FormData = ReviewerFormData & OrgAdminFormData;

const INITIAL_FORM_DATA: Partial<FormData> = {
  name: "",
  date_of_birth: "",
  email: "",
  password: "",
  repassword: "",
  educationLevel: "",
  domainIds: [],
  specializationIds: [],
  organizationName: "",
  organizationEmail: "",
  adminEmail: "",
  adminFullName: "",
  organizationType: "",
  registrationNumber: "",
  hotline: "",
  address: "",
};

export default function Signup() {
  const { showToast } = useToast();
  const [userType, setUserType] = useState<UserType>("reader");
  const [data, setData] = useState<Partial<FormData>>(INITIAL_FORM_DATA);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const refs = React.useRef<{ [k: string]: HTMLDivElement | null }>({});

  // File uploads
  const [backgroundFiles, setBackgroundFiles] = useState<File[]>([]);
  const [logoFile, setLogoFile] = useState<File[]>([]); // Organization logo (optional)

  // Terms of Use
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isPolicyViewerOpen, setIsPolicyViewerOpen] = useState(false);

  // Options for reviewer
  const [domainOptions, setDomainOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [specializationOptions, setSpecializationOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const loadReviewerOptions = useCallback(async () => {
    try {
      // Add delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));
      const domains = await getDomains();
      setDomainOptions(domains);
    } catch {
      showToast({
        type: "error",
        title: VALIDATION_MESSAGES.loadFailed.title,
        message: VALIDATION_MESSAGES.loadFailed.message,
        duration: 5000,
      });
    }
  }, [showToast]);

  const loadSpecializations = useCallback(
    async (domainIds: string[]) => {
      try {
        // Add delay for better UX
        await new Promise((resolve) => setTimeout(resolve, 500));
        const specs = await getSpecializations(domainIds);
        setSpecializationOptions(specs);
      } catch {
        showToast({
          type: "error",
          title: VALIDATION_MESSAGES.loadFailed.title,
          message: "Failed to load specializations",
          duration: 5000,
        });
      }
    },
    [showToast],
  );

  React.useEffect(() => {
    if (userType === "reviewer") {
      loadReviewerOptions();
    }
  }, [userType, loadReviewerOptions]);

  React.useEffect(() => {
    if (userType === "reviewer" && data.domainIds && data.domainIds.length > 0) {
      loadSpecializations(data.domainIds);
    } else {
      setSpecializationOptions([]);
    }
  }, [data.domainIds, userType, loadSpecializations]);

  const validateAll = useCallback(
    (form: Partial<FormData>) => {
      const nextErrors: { [k: string]: string } = {};
      const fieldsToValidate = getFieldsToValidate(userType);

      fieldsToValidate.forEach((key) => {
        const msg = validateFieldHelper(
          key,
          form[key as keyof FormData] as string | string[],
          userType,
          form as Record<string, string | string[] | undefined>,
        );
        if (msg) nextErrors[key] = msg;
      });

      setErrors(nextErrors);
      return nextErrors;
    },
    [userType],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      // Prevent space input in password and email fields
      let filteredValue = value;
      if ((name === "password" || name === "repassword" || name === "email") && value.includes(" ")) {
        filteredValue = value.replace(/\s/g, "");
      }
      setData((prev) => ({ ...prev, [name]: filteredValue }));
      const msg = validateFieldHelper(name, filteredValue, userType, {
        ...data,
        [name]: filteredValue,
      });
      setErrors((prev) => ({ ...prev, [name]: msg }));
    },
    [data, userType],
  );

  const handleMultiSelectChange = useCallback(
    (name: string, value: string, checked: boolean) => {
      setData((prev) => {
        const currentValues = (prev[name as keyof FormData] as string[]) || [];
        const newValues = checked
          ? [...currentValues, value]
          : currentValues.filter((v) => v !== value);

        const msg = validateFieldHelper(name, newValues, userType, {
          ...prev,
          [name]: newValues,
        });
        setErrors((prevErrors) => ({ ...prevErrors, [name]: msg }));

        return { ...prev, [name]: newValues };
      });
    },
    [userType],
  );

  const handleFileUpload = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      fieldType: "background" | "certificate",
    ) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      // Allowed file types: application/pdf, image/jpeg, image/jpg, image/png
      const ALLOWED_TYPES = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];

      // Validate file type
      const invalidFiles = files.filter(
        (file) => !ALLOWED_TYPES.includes(file.type)
      );
      
      if (invalidFiles.length > 0) {
        const fileTypeLabel = fieldType === "certificate" ? "Logo" : "Background";
        showToast({
          type: "error",
          title: "Invalid File Type",
          message: `${fileTypeLabel} must be PDF, JPEG, JPG, or PNG file`,
          duration: 5000,
        });
        e.target.value = "";
        return;
      }

      // For certificate (logo), only allow images (no PDF)
      if (fieldType === "certificate") {
        const nonImageFiles = files.filter(
          (file) => !file.type.startsWith("image/")
        );
        if (nonImageFiles.length > 0) {
          showToast({
            type: "error",
            title: "Invalid File Type",
            message: "Logo must be an image file (JPEG, JPG, or PNG)",
            duration: 5000,
          });
          e.target.value = "";
          return;
        }
      }

      // Validate file size
      const sizeError = validateFileSize(files);
      if (sizeError) {
        showToast({
          type: "error",
          title: "File Too Large",
          message: sizeError,
          duration: 5000,
        });
        // Clear the input
        e.target.value = "";
        return;
      }

      if (fieldType === "background") {
        setBackgroundFiles(files);
        // Clear error when file is uploaded
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.backgroundFiles;
          return newErrors;
        });
      } else {
        setLogoFile(files);
        // Clear error when file is uploaded (logo is optional, but clear any existing error)
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.logoFile;
          return newErrors;
        });
      }
    },
    [showToast],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const errs = validateAll(data);

      // Validate file uploads for reviewer (logo is optional for org-admin)
      const fileErrors = validateFileUploadRequired(
        userType,
        backgroundFiles,
        logoFile,
      );
      Object.assign(errs, fileErrors);

      if (Object.keys(errs).length > 0) {
        const firstKey = Object.keys(errs)[0];
        const group = refs.current[firstKey];
        const input = group?.querySelector("input, select") as
          | HTMLInputElement
          | undefined;
        input?.focus();
        showToast({
          type: "error",
          title: VALIDATION_MESSAGES.error.title,
          message: Object.values(errs)[0] || VALIDATION_MESSAGES.error.message,
          duration: 5000,
        });
        return;
      }

      // Submit based on user type
      if (userType === "reader") {
        const payload: RegisterReaderPayload = {
          email: data.email!.toLowerCase().trim(),
          password: data.password!,
          fullName: data.name!.trim(),
          dateOfBirth: data.date_of_birth!,
        };
        await registerReader(payload);
      } else if (userType === "reviewer") {
        const payload: RegisterReviewerPayload = {
          email: data.email!.toLowerCase().trim(),
          password: data.password!,
          fullName: data.name!.trim(),
          dateOfBirth: data.date_of_birth!,
          orcid: data.orcid,
          educationLevel: data.educationLevel! as "COLLEGE" | "UNIVERSITY" | "MASTER" | "DOCTORATE",
          organizationName: data.organizationName!,
          organizationEmail: data.organizationEmail!.toLowerCase().trim(),
          domainIds: data.domainIds!,
          specializationIds: data.specializationIds!,
        };
        await registerReviewer(payload, backgroundFiles);
      } else if (userType === "org-admin") {
        const payload: RegisterOrgAdminPayload = {
          adminEmail: data.email!.toLowerCase().trim(),
          password: data.password!,
          adminFullName: data.name!.trim(),
          organizationName: data.organizationName!,
          organizationType: data.organizationType! as "SCHOOL" | "COLLEGE" | "UNIVERSITY" | "TRAINING_CENTER",
          organizationEmail: data.organizationEmail!.toLowerCase().trim(),
          hotline: data.hotline!,
          address: data.address!,
          registrationNumber: data.registrationNumber!,
        };
        // Only send first file as logoFile (optional)
        await registerOrgAdmin(payload, logoFile.length > 0 ? logoFile[0] : undefined);
      }

      // Success: inform user to check email for verification
      showToast({
        type: "success",
        title: VALIDATION_MESSAGES.success.title,
        message: SUCCESS_MESSAGES[userType],
        duration: 5000,
      });
      setTimeout(() => {
        window.location.href = "/auth/sign-in";
      }, 3000);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : VALIDATION_MESSAGES.failed.message;
      showToast({
        type: "error",
        title: VALIDATION_MESSAGES.failed.title,
        message: msg,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeChange = useCallback((type: UserType) => {
    setUserType(type);
    // Keep base fields, clear role-specific fields
    if (type === "reader" || type === "reviewer") {
      setData((prev) => ({
        name: prev.name,
        date_of_birth: prev.date_of_birth,
        email: prev.email,
        password: prev.password,
        repassword: prev.repassword,
        educationLevel: "",
        domainIds: [],
        specializationIds: [],
        organizationName: "",
        organizationEmail: "",
      }));
    } else {
      // org-admin uses name and email from base fields
      setData((prev) => ({
        name: prev.name,
        email: prev.email,
        password: prev.password,
        repassword: prev.repassword,
        organizationName: "",
        organizationType: "",
        organizationEmail: "",
        hotline: "",
        address: "",
        registrationNumber: "",
      }));
    }
    setErrors({});
    setBackgroundFiles([]);
    setLogoFile([]);
  }, []);

  return (
    <>
      <div className={styles["logo-row"]}>
        <Image
          src={Logo}
          alt="Logo"
          width={150}
          height={150}
          className="dark:hidden"
        />
        <Image
          src={LogoDark}
          alt="Logo"
          width={150}
          height={150}
          className="hidden dark:block"
        />
      </div>

      <div>
        <form onSubmit={handleSubmit}>
          {/* Base Fields */}
          <InputGroup
            type="string"
            label="Full Name"
            className={styles["input-group"]}
            placeholder="Enter your full name"
            name="name"
            handleChange={handleChange}
            value={data.name}
            icon={<UserIcon />}
            error={errors.name}
            required
          />
          {errors.name && <p className={styles["error-text"]}>{errors.name}</p>}

          {userType !== "org-admin" && (
            <>
              <InputGroup
                type="date"
                label="Date of Birth"
                className={styles["input-group"]}
                placeholder="Enter your date of birth"
                name="date_of_birth"
                handleChange={handleChange}
                value={data.date_of_birth}
                error={errors.date_of_birth}
                required
              />
              {errors.date_of_birth && (
                <p className={styles["error-text"]}>{errors.date_of_birth}</p>
              )}
            </>
          )}

          <InputGroup
            type="email"
            label="Email"
            className={styles["input-group-tight"]}
            placeholder="Enter your email"
            name="email"
            handleChange={handleChange}
            value={data.email}
            icon={<EmailIcon />}
            error={errors.email}
            required
          />
          {errors.email && (
            <p className={styles["error-text-slight"]}>{errors.email}</p>
          )}

          <InputGroup
            type="password"
            label="Password"
            className={styles["input-group"]}
            placeholder="Enter your password"
            name="password"
            handleChange={handleChange}
            value={data.password}
            icon={<PasswordIcon />}
            error={errors.password}
            required
          />
          {errors.password && (
            <p className={styles["error-text"]}>{errors.password}</p>
          )}

          <InputGroup
            type="password"
            label="Confirm Password"
            className={styles["input-group"]}
            placeholder="Re-enter your password"
            name="repassword"
            handleChange={handleChange}
            value={data.repassword}
            icon={<PasswordIcon />}
            error={errors.repassword}
            required
          />
          {errors.repassword && (
            <p className={styles["error-text"]}>{errors.repassword}</p>
          )}

          {/* User Type Selection */}
          <div className={styles["user-type-container"]}>
            <label className={styles["user-type-label"]}>Register as</label>
            <div className={styles["user-type-options"]}>
              <label className={styles["user-type-option"]}>
                <input
                  type="radio"
                  name="userType"
                  value="reader"
                  checked={userType === "reader"}
                  onChange={() => handleUserTypeChange("reader")}
                  className={styles["user-type-radio"]}
                  disabled={loading}
                />
                <span className={styles["user-type-text"]}>Reader</span>
              </label>
              <label className={styles["user-type-option"]}>
                <input
                  type="radio"
                  name="userType"
                  value="reviewer"
                  checked={userType === "reviewer"}
                  onChange={() => handleUserTypeChange("reviewer")}
                  className={styles["user-type-radio"]}
                  disabled={loading}
                />
                <span className={styles["user-type-text"]}>Reviewer</span>
              </label>
              <label className={styles["user-type-option"]}>
                <input
                  type="radio"
                  name="userType"
                  value="org-admin"
                  checked={userType === "org-admin"}
                  onChange={() => handleUserTypeChange("org-admin")}
                  className={styles["user-type-radio"]}
                  disabled={loading}
                />
                <span className={styles["user-type-text"]}>
                  Organization Admin
                </span>
              </label>
            </div>
          </div>

          {/* Reviewer Fields */}
          {userType === "reviewer" && (
            <div className={styles["role-section"]}>
              <h3 className={styles["role-section-title"]}>
                Reviewer Information
              </h3>

              <InputGroup
                type="string"
                label="ORCID"
                className={styles["input-group"]}
                placeholder="Enter your ORCID (optional)"
                name="orcid"
                handleChange={handleChange}
                value={data.orcid || ""}
                error={errors.orcid}
              />

              <div className="mb-4">
                <label
                  htmlFor="educationLevel"
                  className={styles["form-label"]}
                >
                  Education Level{" "}
                  <span className={styles["form-label-required"]}>*</span>
                </label>
                <select
                  id="educationLevel"
                  name="educationLevel"
                  value={data.educationLevel}
                  onChange={handleChange}
                  className={`${styles["form-select"]} ${errors.educationLevel ? styles["form-select-error"] : ""}`}
                  disabled={loading}
                >
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {errors.educationLevel && (
                  <p className={styles["form-error"]}>
                    {errors.educationLevel}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className={styles["form-label"]}>
                  Domains{" "}
                  <span className={styles["form-label-required"]}>*</span>
                  <span className={styles["form-label-hint"]}>
                    (Max 3, Min 1)
                  </span>
                </label>
                <div className={styles["checkbox-list-container"]}>
                  {domainOptions.length === 0 ? (
                    <p className={styles["checkbox-list-empty"]}>
                      Loading domains...
                    </p>
                  ) : (
                    <div className={styles["checkbox-list"]}>
                      {domainOptions.map((domain) => (
                        <label
                          key={domain.id}
                          className={styles["checkbox-item"]}
                        >
                          <input
                            type="checkbox"
                            checked={(data.domainIds || []).includes(domain.id)}
                            onChange={(e) =>
                              handleMultiSelectChange(
                                "domainIds",
                                domain.id,
                                e.target.checked,
                              )
                            }
                            className={styles["checkbox-input"]}
                            disabled={
                              loading ||
                              ((data.domainIds || []).length >= 3 &&
                                !(data.domainIds || []).includes(domain.id))
                            }
                          />
                          <span className={styles["checkbox-label"]}>
                            {domain.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {errors.domainIds && (
                  <p className={styles["form-error"]}>{errors.domainIds}</p>
                )}
              </div>

              <div className="mb-4">
                <label className={styles["form-label"]}>
                  Review Specializations{" "}
                  <span className={styles["form-label-required"]}>*</span>
                  <span className={styles["form-label-hint"]}>
                    (Max 5, Min 1 per Domain)
                  </span>
                </label>
                <div className={styles["checkbox-list-container"]}>
                  {specializationOptions.length === 0 ? (
                    <p className={styles["checkbox-list-empty"]}>
                      {(data.domainIds || []).length === 0
                        ? "Please select domains first"
                        : "Loading specializations..."}
                    </p>
                  ) : (
                    <div className={styles["checkbox-list"]}>
                      {specializationOptions.map((spec) => (
                        <label
                          key={spec.id}
                          className={styles["checkbox-item"]}
                        >
                          <input
                            type="checkbox"
                            checked={(data.specializationIds || []).includes(
                              spec.id,
                            )}
                            onChange={(e) =>
                              handleMultiSelectChange(
                                "specializationIds",
                                spec.id,
                                e.target.checked,
                              )
                            }
                            className={styles["checkbox-input"]}
                            disabled={
                              loading ||
                              ((data.specializationIds || []).length >= 5 &&
                                !(data.specializationIds || []).includes(spec.id))
                            }
                          />
                          <span className={styles["checkbox-label"]}>
                            {spec.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {errors.specializationIds && (
                  <p className={styles["form-error"]}>
                    {errors.specializationIds}
                  </p>
                )}
              </div>

              <InputGroup
                type="string"
                label="Organization Name"
                className={styles["input-group"]}
                placeholder="Enter organization name"
                name="organizationName"
                handleChange={handleChange}
                value={data.organizationName}
                error={errors.organizationName}
                required
              />
              {errors.organizationName && (
                <p className={styles["error-text"]}>
                  {errors.organizationName}
                </p>
              )}

              <InputGroup
                type="email"
                label="Organization Email"
                className={styles["input-group"]}
                placeholder="Enter organization email"
                name="organizationEmail"
                handleChange={handleChange}
                value={data.organizationEmail}
                icon={<EmailIcon />}
                error={errors.organizationEmail}
                required
              />
              {errors.organizationEmail && (
                <p className={styles["error-text"]}>
                  {errors.organizationEmail}
                </p>
              )}

              <div className="mb-4">
                <label
                  htmlFor="backgroundUpload"
                  className={styles["form-label"]}
                >
                  Verified Background Upload{" "}
                  <span className={styles["form-label-required"]}>*</span>
                  <span className={styles["form-label-hint"]}>
                    (PDF, JPEG, JPG, PNG)
                  </span>
                </label>
                <input
                  id="backgroundUpload"
                  type="file"
                  accept="application/pdf,image/jpeg,image/jpg,image/png"
                  multiple
                  onChange={(e) => handleFileUpload(e, "background")}
                  className={`${styles["file-upload"]} ${errors.backgroundFiles ? "border-red-500" : ""}`}
                  disabled={loading}
                />
                {backgroundFiles.length > 0 ? (
                  <div className={styles["file-list"]}>
                    {backgroundFiles.map((file, idx) => (
                      <p key={idx} className={styles["file-item"]}>
                        • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </p>
                    ))}
                  </div>
                ) : (
                  errors.backgroundFiles && (
                    <p className={styles["form-error"]}>
                      {errors.backgroundFiles}
                    </p>
                  )
                )}
              </div>
            </div>
          )}

          {/* Organization Admin Fields */}
          {userType === "org-admin" && (
            <div className={styles["role-section"]}>
              <h3 className={styles["role-section-title"]}>
                Organization Information
              </h3>

              <InputGroup
                type="string"
                label="Organization Name"
                className={styles["input-group"]}
                placeholder="Enter organization name"
                name="organizationName"
                handleChange={handleChange}
                value={data.organizationName}
                error={errors.organizationName}
                required
              />
              {errors.organizationName && (
                <p className={styles["error-text"]}>
                  {errors.organizationName}
                </p>
              )}

              <div className="mb-4">
                <label
                  htmlFor="organizationType"
                  className={styles["form-label"]}
                >
                  Organization Type{" "}
                  <span className={styles["form-label-required"]}>*</span>
                </label>
                <select
                  id="organizationType"
                  name="organizationType"
                  value={data.organizationType}
                  onChange={handleChange}
                  className={`${styles["form-select"]} ${errors.organizationType ? styles["form-select-error"] : ""}`}
                  disabled={loading}
                >
                  {ORGANIZATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.organizationType && (
                  <p className={styles["form-error"]}>
                    {errors.organizationType}
                  </p>
                )}
              </div>

              <InputGroup
                type="string"
                label="Registration Number"
                className={styles["input-group"]}
                placeholder="Enter registration number"
                name="registrationNumber"
                handleChange={handleChange}
                value={data.registrationNumber}
                error={errors.registrationNumber}
                required
              />
              {errors.registrationNumber && (
                <p className={styles["error-text"]}>
                  {errors.registrationNumber}
                </p>
              )}

              <InputGroup
                type="email"
                label="Organization Email"
                className={styles["input-group"]}
                placeholder="Enter organization email"
                name="organizationEmail"
                handleChange={handleChange}
                value={data.organizationEmail}
                icon={<EmailIcon />}
                error={errors.organizationEmail}
                required
              />
              {errors.organizationEmail && (
                <p className={styles["error-text"]}>
                  {errors.organizationEmail}
                </p>
              )}

              <InputGroup
                type="string"
                label="Hotline"
                className={styles["input-group"]}
                placeholder="Enter hotline"
                name="hotline"
                handleChange={handleChange}
                value={data.hotline}
                error={errors.hotline}
                required
              />
              {errors.hotline && (
                <p className={styles["error-text"]}>
                  {errors.hotline}
                </p>
              )}

              <InputGroup
                type="string"
                label="Address"
                className={styles["input-group"]}
                placeholder="Enter address"
                name="address"
                handleChange={handleChange}
                value={data.address}
                error={errors.address}
                required
              />
              {errors.address && (
                <p className={styles["error-text"]}>
                  {errors.address}
                </p>
              )}

              <div className="mb-4">
                <label
                  htmlFor="logoUpload"
                  className={styles["form-label"]}
                >
                  Organization Logo Upload{" "}
                  <span className={styles["form-label-hint"]}>
                    (Optional - JPEG, JPG, PNG only)
                  </span>
                </label>
                <input
                  id="logoUpload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleFileUpload(e, "certificate")}
                  className={`${styles["file-upload"]} ${errors.certificateFiles ? "border-red-500" : ""}`}
                  disabled={loading}
                />
                {logoFile.length > 0 && (
                  <div className={styles["file-list"]}>
                    {logoFile.map((file, idx) => (
                      <p key={idx} className={styles["file-item"]}>
                        • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-4.5 mt-6">
            <div className={styles["terms-checkbox-container"]}>
              <label className={styles["terms-checkbox-label"]}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className={styles["terms-checkbox"]}
                />
                <span className={styles["terms-checkbox-text"]}>
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsPolicyViewerOpen(true);
                    }}
                    className={styles["terms-link"]}
                  >
                    Terms of Use
                  </button>
                </span>
              </label>
            </div>
            <button
              type="submit"
              className={styles["submit-btn"]}
              disabled={loading || !agreedToTerms}
            >
              {loading ? (
                <>
                  Creating Account
                  <span className={styles.spinner} />
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.footer}>
        <p>
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>

      {/* Policy Viewer Modal */}
      <PolicyViewer
        isOpen={isPolicyViewerOpen}
        onClose={() => setIsPolicyViewerOpen(false)}
      />
    </>
  );
}
