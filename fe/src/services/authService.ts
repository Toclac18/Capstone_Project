import { apiClient } from "./http";

/**
 * Auth Service
 * Gọi /api/auth/* (API Route BFF)
 */

export type RegisterPayload = {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  username: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  status: string;
  message?: string;
};

export type VerifyEmailResponse = {
  message: string;
  success: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
  role: "READER" | "REVIEWER" | "ORGANIZATION" | "SYSTEM_ADMIN" | "BUSINESS_ADMIN";
  remember?: boolean;
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

/**
 * Login with email, password and role
 */
export async function login(data: LoginPayload): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/login", data);
  return res.data;
}

/**
 * Register new reader account
 */
export async function registerReader(
  data: RegisterPayload
): Promise<RegisterResponse> {
  const res = await apiClient.post<RegisterResponse>("/auth/register", data);
  return res.data;
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const res = await apiClient.get<VerifyEmailResponse>(
    `/auth/verify-email?token=${encodeURIComponent(token)}`
  );
  return res.data;
}

/**
 * Logout - clear cookie and localStorage
 */
export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
}
