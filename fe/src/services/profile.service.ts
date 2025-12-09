import { apiClient } from "./http";

export type UserRole =
  | "READER"
  | "REVIEWER";

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


// Unified Profile Response for UI
export type ProfileResponse = 
  | (ReaderProfileResponse & { role: "READER" })
  | (ReviewerProfileResponse & { role: "REVIEWER" });

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
    default:
      throw new Error(`Unsupported role: ${role}. Profile service only supports READER and REVIEWER.`);
  }

  const res = await apiClient.get<ProfileResponse>(endpoint);
  // Response is already parsed by API route (extracted from { success, data, timestamp })
  return { ...res.data, role: role as "READER" | "REVIEWER" } as ProfileResponse;
}

/**
 * Update user profile based on role
 */
export async function updateProfile(
  role: string,
  data: Partial<ReaderProfileResponse | ReviewerProfileResponse>
): Promise<ProfileResponse> {
  let endpoint: string;
  
  switch (role) {
    case "READER":
      endpoint = "/reader/profile";
      break;
    case "REVIEWER":
      endpoint = "/reviewer/profile";
      break;
    default:
      throw new Error(`Unsupported role: ${role}. Profile service only supports READER and REVIEWER.`);
  }

  const res = await apiClient.put<ProfileResponse>(endpoint, data);
  // Response is already parsed by API route (extracted from { success, data, timestamp })
  return { ...res.data, role: role as "READER" | "REVIEWER" } as ProfileResponse;
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
export async function deleteAccount(password: string): Promise<void> {
  await apiClient.delete("/profile/delete-account", {
    data: { password },
  });
}

