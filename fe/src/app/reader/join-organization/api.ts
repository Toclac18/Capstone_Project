import {
  joinOrganization as joinOrganizationService,
  type JoinOrganizationResponse,
} from "@/services/organizations";

export type { JoinOrganizationResponse };

export async function joinOrganization(
  token: string,
): Promise<JoinOrganizationResponse> {
  return joinOrganizationService(token);
}

