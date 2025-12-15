import { apiClient } from "@/services/http";

export type TicketStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketCategory = "PAYMENT" | "ACCESS" | "CONTENT" | "TECHNICAL" | "ACCOUNT" | "OTHER";
export type TicketUrgency = "LOW" | "NORMAL" | "HIGH";

export type Ticket = {
  ticketId: string;
  ticketCode: string;
  status: TicketStatus;
  name: string;
  email: string;
  category: TicketCategory;
  otherCategory?: string;
  urgency: TicketUrgency;
  subject: string;
  ticketMessage: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PageInfo = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type TicketsResponse = {
  data: Ticket[];
  pageInfo: PageInfo;
};

export type GetTicketsParams = {
  status?: TicketStatus;
  email?: string;
  page?: number;
  size?: number;
};

export async function getTickets(params: GetTicketsParams = {}): Promise<TicketsResponse> {
  const res = await apiClient.get<TicketsResponse>("/business-admin/tickets", { params });
  return res.data;
}

export type UpdateTicketPayload = {
  status?: TicketStatus;
  adminNotes?: string;
};

export async function updateTicket(ticketId: string, payload: UpdateTicketPayload): Promise<Ticket> {
  const res = await apiClient.patch<Ticket>(`/business-admin/tickets/${ticketId}`, payload);
  return res.data;
}

export async function getTicketById(ticketId: string): Promise<Ticket> {
  const res = await apiClient.get<Ticket>(`/business-admin/tickets/${ticketId}`);
  return res.data;
}
