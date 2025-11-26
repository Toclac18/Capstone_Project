// src/app/contact-admin/api.ts
import {
  submitTicket as submitTicketService,
  type ContactAdminPayload,
  type ContactAdminResponse,
} from "@/services/contact-admin.service";

export type { ContactAdminPayload, ContactAdminResponse };

export async function postJSON(
  payload: ContactAdminPayload,
): Promise<ContactAdminResponse> {
  return submitTicketService(payload);
}
