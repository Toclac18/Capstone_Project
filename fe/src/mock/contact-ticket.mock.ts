// contact-ticket.mock.ts

import { ContactTicketDetail } from "@/types/contact-ticket";

export const MOCK_CONTACT_TICKET: ContactTicketDetail = {
  id: "8b9e1aa7-8cd9-4d79-8f0a-b2c91884f7c1",
  ticketCode: "SUP-2025-00123",
  status: "NEW",
  urgency: "HIGH",
  category: "Technical Issue",
  otherCategory: null,
  name: "John Doe",
  email: "john.doe@example.com",
  ipAddress: "203.113.123.1",
  subject: "Cannot access my purchased document",
  message: `Hello Admin,
I purchased document #4234 on READEE Platform, but I cannot open the link.
Please check for me. Thank you.`,
  adminNotes: null,
  createdAt: "2025-02-10T07:20:00.000Z",
  updatedAt: "2025-02-10T07:20:00.000Z",
};

// Simulate backend list (for extended features)
export const MOCK_CONTACT_TICKET_LIST: ContactTicketDetail[] = [
  MOCK_CONTACT_TICKET,
  {
    id: "11111111-2222-3333-4444-555555555555",
    ticketCode: "SUP-2025-00124",
    status: "IN_PROGRESS",
    urgency: "NORMAL",
    category: "Account",
    otherCategory: null,
    name: "Test User",
    email: "user@example.com",
    ipAddress: "113.22.33.44",
    subject: "Need help updating email",
    message: "I want to update my email but can't find the option.",
    adminNotes: "Checked user account → pending verification.",
    createdAt: "2025-02-11T01:12:00.000Z",
    updatedAt: "2025-02-11T06:40:00.000Z",
  },
];
