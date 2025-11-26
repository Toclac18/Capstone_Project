import { apiClient } from "./http";

// ============ Types ============
export type RegisterReaderPayload = {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
};

export type RegisterReviewerPayload = RegisterReaderPayload & {
  orcid?: string; // Optional
  educationLevel: "COLLEGE" | "UNIVERSITY" | "MASTER" | "DOCTORATE";
  organizationName: string;
  organizationEmail: string;
  domainIds: string[]; // UUIDs, 1-3 domains
  specializationIds: string[]; // UUIDs, 1-5 specializations
};

export type RegisterOrgAdminPayload = {
  adminEmail: string;
  password: string;
  adminFullName: string;
  organizationName: string;
  organizationType: "SCHOOL" | "COLLEGE" | "UNIVERSITY" | "TRAINING_CENTER";
  organizationEmail: string;
  hotline: string;
  address: string;
  registrationNumber: string;
};

export type AuthResponse = {
  userId: string; // UUID
  email: string;
  fullName: string;
  role: string;
  status: string;
  accessToken: string | null; // null until email verified
  tokenType?: string;
};

export type RegisterResponse = AuthResponse;


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
  credentialFiles: File[]
): Promise<AuthResponse> {
  const formData = new FormData();
  
  // Add data as JSON blob (backend expects @RequestPart("data"))
  const data = {
    email: payload.email,
    password: payload.password,
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth,
    orcid: payload.orcid || null,
    educationLevel: payload.educationLevel,
    organizationName: payload.organizationName,
    organizationEmail: payload.organizationEmail,
    domainIds: payload.domainIds,
    specializationIds: payload.specializationIds,
  };
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  
  // Add credential files (backend expects @RequestPart("credentialFiles"))
  credentialFiles.forEach((file) => {
    formData.append("credentialFiles", file);
  });

  const res = await apiClient.post<AuthResponse>(
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
  logoFile?: File
): Promise<AuthResponse> {
  const formData = new FormData();
  
  // Add data as JSON blob (backend expects @RequestPart("data"))
  const data = {
    adminEmail: payload.adminEmail,
    password: payload.password,
    adminFullName: payload.adminFullName,
    organizationName: payload.organizationName,
    organizationType: payload.organizationType,
    organizationEmail: payload.organizationEmail,
    hotline: payload.hotline,
    address: payload.address,
    registrationNumber: payload.registrationNumber,
  };
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  
  // Add logo file (optional, backend expects @RequestPart(value = "logoFile", required = false))
  if (logoFile) {
    formData.append("logoFile", logoFile);
  }

  const res = await apiClient.post<AuthResponse>(
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

export type LoginResponse = {
  success: boolean;
  role: string;
  userId: string;
  email: string;
  fullName: string;
  status: string;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/login", payload);
  return res.data;
}

// ============ Verify Email ============
export type VerifyEmailResponse = AuthResponse;

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const res = await apiClient.post<VerifyEmailResponse>(
    "/auth/verify-email",
    { token }
  );
  return res.data;
}

// ============ Logout ============
export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

// ============ Forgot Password ============
export type RequestPasswordResetPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
};

export async function requestPasswordReset(
  payload: RequestPasswordResetPayload
): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>(
    "/auth/request-password-reset",
    payload
  );
  return res.data;
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>(
    "/auth/reset-password",
    payload
  );
  return res.data;
}
