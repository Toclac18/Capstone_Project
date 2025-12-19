// src/app/auth/sign-up/api.ts
import {
  registerReader as registerReaderService,
  registerReviewer as registerReviewerService,
  registerOrganization as registerOrganizationService,
  type RegisterReaderPayload,
  type RegisterReviewerPayload,
  type RegisterOrgAdminPayload,
  AuthResponse,
} from "@/services/auth.service";

export type {
  RegisterReaderPayload,
  RegisterReviewerPayload,
  RegisterOrgAdminPayload,
};

export type RegisterResponse = AuthResponse;

export async function registerReader(
  payload: RegisterReaderPayload,
): Promise<RegisterResponse> {
  return registerReaderService(payload);
}

export async function registerReviewer(
  payload: RegisterReviewerPayload,
  files: File[],
): Promise<RegisterResponse> {
  return registerReviewerService(payload, files);
}

export async function registerOrgAdmin(
  payload: RegisterOrgAdminPayload,
  logoFile?: File,
): Promise<RegisterResponse> {
  return registerOrganizationService(payload, logoFile);
}
