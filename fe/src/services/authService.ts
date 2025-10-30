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

/**
 * Register new reader account
 */
export async function registerReader(
  data: RegisterPayload
): Promise<RegisterResponse> {
  const res = await apiClient.post<RegisterResponse>("/auth/register", data);
  return res.data;
}

