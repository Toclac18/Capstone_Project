// Validation helpers for sign-up form

type UserType = "reader" | "reviewer" | "org-admin";

// Constants
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  const age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  return (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) 
    ? age - 1 
    : age;
}

/**
 * Validate individual field
 */
export function validateField(
  name: string, 
  value: string | string[], 
  userType: UserType,
  ctx?: Record<string, string | string[] | undefined>
): string {
  const val = typeof value === "string" ? value?.trim() ?? value : value;

  // Base fields validation
  switch (name) {
    case "name":
      if (!val) return "Full name is required";
      if (typeof val === "string" && val.length < 2) return "Name must be at least 2 characters";
      return "";

    case "date_of_birth": {
      if (!val) return "Date of birth is required";
      const dobDate = new Date(val as string);
      if (isNaN(dobDate.getTime())) return "Invalid date";
      if (dobDate > new Date()) return "Date of birth must be in the past";
      const age = calculateAge(dobDate);
      if (age < 13) return "You must be at least 13 years old";
      return "";
    }


    case "email":
      if (!val) return "Email is required";
      if (typeof val === "string" && !EMAIL_REGEX.test(val)) return "Email is invalid";
      return "";

    case "password":
      if (!val) return "Password is required";
      if (typeof val === "string" && val.length < 8) return "Password must be at least 8 characters";
      if (typeof val === "string" && (!/[A-Za-z]/.test(val) || !/[0-9]/.test(val))) {
        return "Password must include letters and numbers";
      }
      return "";

    case "repassword":
      if (!val) return "Please confirm your password";
      if (val !== (ctx?.password ?? "")) return "Passwords do not match";
      return "";
  }

  // Reviewer fields validation
  if (userType === "reviewer") {
    switch (name) {
      case "educationLevel":
        return !val ? "Education level is required" : "";

      case "domainIds":
        if (!Array.isArray(value) || value.length === 0) return "At least 1 domain is required";
        if (value.length > 3) return "Maximum 3 domains allowed";
        return "";

      case "specializationIds":
        if (!Array.isArray(value) || value.length === 0) return "At least 1 specialization is required";
        if (value.length > 5) return "Maximum 5 specializations allowed";
        return "";

      case "organizationName":
        return !val ? "Organization name is required" : "";

      case "organizationEmail":
        if (!val) return "Organization email is required";
        if (typeof val === "string" && !EMAIL_REGEX.test(val)) return "Email is invalid";
        return "";
    }
  }

  // Organization Admin fields validation
  if (userType === "org-admin") {
    switch (name) {
      case "organizationName":
        return !val ? "Organization name is required" : "";

      case "organizationType":
        return !val ? "Organization type is required" : "";

      case "registrationNumber":
        return !val ? "Registration number is required" : "";

      case "organizationEmail":
        if (!val) return "Organization email is required";
        if (typeof val === "string" && !EMAIL_REGEX.test(val)) return "Email is invalid";
        return "";

      case "hotline":
        return !val ? "Hotline is required" : "";

      case "address":
        if (!val) return "Address is required";
        if (typeof val === "string" && val.length < 10) return "Address must be at least 10 characters";
        return "";
    }
  }

  return "";
}

/**
 * Get fields to validate based on user type
 */
export function getFieldsToValidate(userType: UserType): string[] {
  const baseFields = ["name", "date_of_birth", "email", "password", "repassword"];

  if (userType === "reviewer") {
    return [
      ...baseFields,
      "educationLevel",
      "domainIds",
      "specializationIds",
      "organizationName",
      "organizationEmail",
    ];
  }

  if (userType === "org-admin") {
    return [
      "name",
      "email",
      "password",
      "repassword",
      "organizationName",
      "organizationType",
      "registrationNumber",
      "organizationEmail",
      "hotline",
      "address",
    ];
  }

  return baseFields;
}

/**
 * Validate file size (max 10MB per file)
 * Returns error message if any file exceeds limit, empty string otherwise
 */
export function validateFileSize(files: File[]): string {
  const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
  
  if (oversizedFiles.length > 0) {
    const fileNames = oversizedFiles.map((f) => f.name).join(", ");
    return `The following file(s) exceed 10MB limit: ${fileNames}`;
  }
  
  return "";
}

/**
 * Validate file upload requirement for reviewer and org-admin
 */
export function validateFileUploadRequired(
  userType: UserType,
  backgroundFiles: File[],
  certificateFiles: File[]
): { backgroundFiles?: string; certificateFiles?: string } {
  const errors: { backgroundFiles?: string; certificateFiles?: string } = {};

  if (userType === "reviewer" && backgroundFiles.length === 0) {
    errors.backgroundFiles = "Verified background upload is required";
  }

  if (userType === "org-admin" && certificateFiles.length === 0) {
    errors.certificateFiles = "Organization certificate upload is required";
  }

  return errors;
}

