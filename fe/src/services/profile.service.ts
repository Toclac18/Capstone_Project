import { apiClient } from "./http";

export type UserRole =
  | "READER"
  | "REVIEWER"
  | "ORGANIZATION"
  | "BUSINESS_ADMIN"
  | "SYSTEM_ADMIN";

export interface ProfileResponse {
  id: string;
  dateOfBirth?: string;
  role: UserRole;
  email: string;
  fullName?: string;
  username?: string;
  coinBalance?: number;
  status?: string;
  ordid?: string;
  organizationName?: string;
  organizationEmail?: string;
  organizationHotline?: string;
  organizationLogo?: string;
  organizationAddress?: string;
  active?: boolean;
  deleted?: boolean;
}

/**
 * Backend response format: { data: ProfileResponse }
 */
type BackendResponse<T> = {
  data: T;
};

/**
 * Fetch user profile from backend via Next API (/api/profile/get)
 */
export async function getProfile(): Promise<ProfileResponse> {
  const res = await apiClient.get<BackendResponse<ProfileResponse>>("/profile/get");
  return res.data.data;
}

/**
 * Update user profile via Next API (/api/profile/update)
 */
export async function updateProfile(
  data: Partial<ProfileResponse>
): Promise<ProfileResponse> {
  const res = await apiClient.put<BackendResponse<ProfileResponse>>("/profile/update", data);
  return res.data.data;
}

/**
 * Change email address via Next API (/api/profile/change-email)
 */
export async function changeEmail(
  newEmail: string,
  password: string
): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>("/profile/change-email", {
    newEmail,
    password,
  });
  return res.data;
}

/**
 * Change password via Next API (/api/profile/change-password)
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>("/profile/change-password", {
    currentPassword,
    newPassword,
  });
  return res.data;
}

/**
 * Delete user account via Next API (/api/profile/delete-account)
 */
export async function deleteAccount(
  password: string
): Promise<{ message: string }> {
  const res = await apiClient.post<{ message: string }>("/profile/delete-account", {
    password,
  });
  return res.data;
}

