import { apiClient } from "./http";

// ============ Types ============
export type RegisterReaderPayload = {
  fullName: string;
  dateOfBirth: string;
  username: string;
  email: string;
  password: string;
};

export type RegisterReviewerPayload = RegisterReaderPayload & {
  educationLevel: string;
  domains: string[];
  specializations: string[];
  referenceOrgName: string;
  referenceOrgEmail: string;
};

export type RegisterOrgAdminPayload = RegisterReaderPayload & {
  organizationName: string;
  organizationType: string;
  registrationNumber: string;
  organizationEmail: string;
};

export type RegisterResponse = {
  id: number;
  username: string;
  email: string;
  message: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  subjectId: string;
  role: string;
  email: string;
  displayName: string;
};

// ============ Reader Registration ============
export async function registerReader(
  payload: RegisterReaderPayload
): Promise<RegisterResponse> {
  const res = await apiClient.post<RegisterResponse>(
    "/auth/register/reader",
    payload
  );
  return res.data;
}

// ============ Reviewer Registration ============
export async function registerReviewer(
  payload: RegisterReviewerPayload,
  files?: File[]
): Promise<RegisterResponse> {
  const formData = new FormData();
  
  // Add info as JSON blob
  const info = {
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth,
    username: payload.username,
    email: payload.email,
    password: payload.password,
    educationLevel: payload.educationLevel,
    domains: payload.domains,
    specializations: payload.specializations,
    referenceOrgName: payload.referenceOrgName,
    referenceOrgEmail: payload.referenceOrgEmail,
  };
  formData.append("info", new Blob([JSON.stringify(info)], { type: "application/json" }));
  
  // Add files (required for reviewer)
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("backgroundUploads", file);
    });
  }

  const res = await apiClient.post<RegisterResponse>(
    "/auth/register/reviewer",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
}

// ============ Organization Registration ============
export async function registerOrganization(
  payload: RegisterOrgAdminPayload,
  files?: File[]
): Promise<RegisterResponse> {
  const formData = new FormData();
  
  // Add info as JSON blob
  const info = {
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth,
    username: payload.username,
    email: payload.email,
    password: payload.password,
    organizationName: payload.organizationName,
    organizationType: payload.organizationType,
    registrationNumber: payload.registrationNumber,
    organizationEmail: payload.organizationEmail,
  };
  formData.append("info", new Blob([JSON.stringify(info)], { type: "application/json" }));
  
  // Add files (required for organization)
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append("certificateUploads", file);
    });
  }

  const res = await apiClient.post<RegisterResponse>(
    "/auth/register/org-admin",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
}

// ============ Login ============
export type LoginPayload = {
  email: string;
  password: string;
  role: "READER" | "REVIEWER" | "ORGANIZATION" | "SYSTEM_ADMIN" | "BUSINESS_ADMIN";
  remember?: boolean;
};

// Alias for backward compatibility
export type LoginRequest = LoginPayload;

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/login", payload);
  return res.data;
}

// ============ Verify Email ============
export type VerifyEmailResponse = {
  message: string;
  success: boolean;
};

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const res = await apiClient.get<VerifyEmailResponse>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`
  );
  return res.data;
}

// ============ Logout ============
export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
}
