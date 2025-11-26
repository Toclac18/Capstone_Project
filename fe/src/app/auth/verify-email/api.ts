import {
  verifyEmail as verifyEmailService,
  type VerifyEmailResponse,
} from "@/services/auth.service";

export type { VerifyEmailResponse };

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  return verifyEmailService(token);
}
