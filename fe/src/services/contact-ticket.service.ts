import { ContactTicketDetail } from "@/types/contact-ticket";
import { apiClient } from "./http";

/**
 * Fetch ticket detail by internal UUID (admin-only screen).
 * Flow:
 *   FE  ->  apiClient.get("/contact-tickets/:ticketId")
 *   -> Next API Route: app/api/contact-tickets/[ticketId]/route.ts
 *   -> Spring Boot:    GET /api/contact-tickets/{ticketId}
 */
export async function fetchTicketById(
  ticketId: string,
): Promise<ContactTicketDetail> {
  const res = await apiClient.get<ContactTicketDetail>(
    `/contact-tickets/${ticketId}`,
  );
  return res.data;
}

/**
 * Fetch ticket detail by public ticket code (user tracking).
 * Flow:
 *   FE  ->  apiClient.get("/contact-tickets/code/:ticketCode")
 *   -> Next API Route: app/api/contact-tickets/code/[ticketCode]/route.ts
 *   -> Spring Boot:    GET /api/contact-tickets/code/{ticketCode}
 */
export async function fetchTicketByCode(
  ticketCode: string,
): Promise<ContactTicketDetail> {
  const res = await apiClient.get<ContactTicketDetail>(
    `/contact-tickets/code/${encodeURIComponent(ticketCode)}`,
  );
  return res.data;
}
