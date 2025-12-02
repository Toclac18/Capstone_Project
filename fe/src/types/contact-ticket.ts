// contact-ticket.types.ts

export type ContactTicketDetail = {
  id: string;
  ticketCode: string;
  status: string;
  urgency?: string | null;

  category: string;
  otherCategory?: string | null;

  subject: string;
  message: string;

  name: string;
  email: string;
  ipAddress?: string | null;

  adminNotes?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};
