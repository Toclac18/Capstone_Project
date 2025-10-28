export type TicketCategory =
  | "PAYMENT"
  | "ACCESS"
  | "CONTENT"
  | "TECHNICAL"
  | "ACCOUNT"
  | "OTHER";

export type Urgency = "LOW" | "MEDIUM" | "HIGH";
export type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";

export interface ContactAdminPayload {
  name: string;
  email: string;
  category: TicketCategory;
  otherCategory?: string;
  urgency: Urgency;
  subject: string;
  message: string;
}

export interface Ticket {
  ticketId: string;
  ticketCode: string;
  status: TicketStatus;
  createdAt: string;
  createdBy: { name: string; email: string };
  payload: ContactAdminPayload;
}

const _tickets: Ticket[] = [];

function randomCode(n = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: n })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

export const mockDB = {
  list(): Ticket[] {
    return _tickets.slice().reverse();
  },
  insert(payload: ContactAdminPayload): Ticket {
    const id = crypto.randomUUID();
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}`;
    const ticket: Ticket = {
      ticketId: id,
      ticketCode: `TCK-${date}-${randomCode(5)}`,
      status: "OPEN",
      createdAt: now.toISOString(),
      createdBy: { name: payload.name, email: payload.email },
      payload,
    };
    _tickets.push(ticket);
    return ticket;
  },
  clear() {
    _tickets.length = 0;
  },
};
