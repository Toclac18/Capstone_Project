// src/app/auth/sign-in/api.ts
import {
  login as loginService,
  type LoginPayload,
  type LoginResponse,
} from "@/services/auth.service";

export type { LoginPayload, LoginResponse };

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return loginService(payload);
}
