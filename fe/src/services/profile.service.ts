import { apiClient } from "./http";

export type UserRole =
  | "READER"
  | "REVIEWER"
  | "ORGANIZATION_ADMIN"
  | "BUSINESS_ADMIN"
  | "SYSTEM_ADMIN";

// Reader Profile Response
export interface ReaderProfileResponse {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  point: number | null;
  status: string;
  dob: string | null; // LocalDate from BE
  createdAt: string;
  updatedAt: string;
}

// Reviewer Profile Response
export interface ReviewerProfileResponse {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  point: number | null;
  status: string;
  dateOfBirth: string | null; // LocalDate from BE
  ordid: string | null;
  educationLevel: string;
  organizationName: string | null;
  organizationEmail: string | null;
  credentialFileUrls: string[];
  createdAt: string;
  updatedAt: string;
}

// Organization Profile Response
export interface OrganizationProfileResponse {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  point: number | null;
  status: string;
  orgName: string;
  orgType: string;
  orgEmail: string;
  orgHotline: string | null;
  orgLogo: string | null;
  orgAddress: string | null;
  orgRegistrationNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

// Unified Profile Response for UI
export type ProfileResponse = 
  | (ReaderProfileResponse & { role: "READER" })
  | (ReviewerProfileResponse & { role: "REVIEWER" })
  | (OrganizationProfileResponse & { role: "ORGANIZATION_ADMIN" });

/**
 * Fetch user profile from backend based on role
 */
export async function getProfile(role: string): Promise<ProfileResponse> {
  let endpoint: string;
  
  switch (role) {
    case "READER":
      endpoint = "/reader/profile";
      break;
    case "REVIEWER":
      endpoint = "/reviewer/profile";
      break;
    case "ORGANIZATION_ADMIN":
      endpoint = "/org-admin/profile";
      break;
    default:
      throw new Error(`Unsupported role: ${role}`);
  }

  const res = await apiClient.get<ProfileResponse>(endpoint);
  // Response is already parsed by API route (extracted from { success, data, timestamp })
  return { ...res.data, role: role as UserRole };
}

/**
 * Update user profile based on role
 */
export async function updateProfile(
  role: string,
  data: Partial<ReaderProfileResponse | ReviewerProfileResponse | OrganizationProfileResponse>
): Promise<ProfileResponse> {
  let endpoint: string;
  
  switch (role) {
    case "READER":
      endpoint = "/reader/profile";
      break;
    case "REVIEWER":
      endpoint = "/reviewer/profile";
      break;
    case "ORGANIZATION_ADMIN":
      endpoint = "/org-admin/profile";
      break;
    default:
      throw new Error(`Unsupported role: ${role}`);
  }

  const res = await apiClient.put<ProfileResponse>(endpoint, data);
  // Response is already parsed by API route (extracted from { success, data, timestamp })
  return { ...res.data, role: role as UserRole };
}

/**
 * Upload organization logo
 */
export async function uploadOrganizationLogo(file: File): Promise<OrganizationProfileResponse> {
  const formData = new FormData();
  formData.append("file", file);

  // Use fetch directly for FormData to avoid axios Content-Type issues
  const res = await fetch("/api/org-admin/profile/logo", {
    method: "POST",
    body: formData,
    credentials: "include", // Send cookies
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to upload logo" }));
    throw new Error(error.error || error.message || "Failed to upload logo");
  }

  const json = await res.json();
  // Extract data from { success, data, timestamp } format
  const data = json.data || json;
  return data;
}

/**
 * Request email change - sends OTP to current email
 * POST /api/profile/change-email
 */
export async function requestEmailChange(
  newEmail: string
): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>("/profile/change-email", {
    newEmail,
  });
  return res.data;
}

/**
 * Verify OTP and change email
 * POST /api/profile/verify-email-change
 */
export async function verifyEmailChangeOtp(
  otp: string
): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>("/profile/verify-email-change", {
    otp,
  });
  return res.data;
}

/**
 * Change password
 * PUT /api/profile/change-password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  await apiClient.put("/profile/change-password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });
}

/**
 * Upload avatar
 * POST /api/profile/upload-avatar
 */
export async function uploadAvatar(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  // Use fetch directly for FormData
  const res = await fetch("/api/profile/upload-avatar", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Failed to upload avatar" }));
    throw new Error(error.error || error.message || "Failed to upload avatar");
  }
}

/**
 * Delete user account
 * DELETE /api/profile/delete-account
 */
export async function deleteAccount(): Promise<void> {
  await apiClient.delete("/profile/delete-account");
}

