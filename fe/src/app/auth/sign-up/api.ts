// src/app/auth/sign-up/api.ts
import {
  registerReader as registerReaderService,
  type RegisterPayload,
  type RegisterResponse,
} from "@/services/authService";

export type { RegisterPayload, RegisterResponse };

export async function register(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  return registerReaderService(payload);
}


