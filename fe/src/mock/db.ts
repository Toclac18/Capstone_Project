export type TicketCategory =
  | "PAYMENT"
  | "ACCESS"
  | "CONTENT"
  | "TECHNICAL"
  | "ACCOUNT"
  | "OTHER";

export type Urgency = "LOW" | "NORMAL" | "HIGH";
export type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";

export type NotificationType =
  | "DOCUMENT_APPROVAL"
  | "COMMENT"
  | "TAG_APPROVAL"
  | "PURCHASE"
  | "SYSTEM_UPDATE"
  | "REVIEW_REQUEST"
  | "REVIEW_ASSIGNED"
  | "REVIEW_COMPLETED"
  | "ORGANIZATION_INVITATION"
  | "ORGANIZATION_MEMBER_ADDED"
  | "ORGANIZATION_DOCUMENT_SUBMITTED";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  summary: string;
  timestamp: string;
  isRead: boolean;
}

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

// Mock notifications data
const _notifications: Notification[] = [
  {
    id: "1",
    type: "DOCUMENT_APPROVAL",
    title: "Document Approval Required",
    summary: "Your document 'Project Proposal.pdf' is pending approval from John Doe.",
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    isRead: false,
  },
  {
    id: "2",
    type: "COMMENT",
    title: "New Comment on Your Post",
    summary: "Jane Smith commented on your article 'Getting Started with React'.",
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    isRead: false,
  },
  {
    id: "3",
    type: "TAG_APPROVAL",
    title: "Tag Approval Request",
    summary: "Review tag approval for 'Machine Learning' in the Tech category.",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    isRead: true,
  },
  {
    id: "4",
    type: "PURCHASE",
    title: "Purchase Successful",
    summary: "Your purchase of 'Premium Membership' ($29.99) has been completed.",
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    isRead: true,
  },
  {
    id: "5",
    type: "SYSTEM_UPDATE",
    title: "System Maintenance Scheduled",
    summary: "Scheduled maintenance on Dec 15, 2024 from 2:00 AM to 4:00 AM.",
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    isRead: false,
  },
  {
    id: "6",
    type: "DOCUMENT_APPROVAL",
    title: "Document Approved",
    summary: "Your document 'Quarterly Report Q4' has been approved by the review team.",
    timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    isRead: true,
  },
  {
    id: "7",
    type: "REVIEW_REQUEST",
    title: "Review Request Received",
    summary: "New review request for 'Machine Learning Basics' from Tech Publications.",
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    isRead: false,
  },
  {
    id: "8",
    type: "REVIEW_ASSIGNED",
    title: "Review Assigned to You",
    summary: "You have been assigned to review 'Advanced React Patterns' document.",
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    isRead: false,
  },
  {
    id: "9",
    type: "REVIEW_COMPLETED",
    title: "Review Completed",
    summary: "Your review of 'Node.js Best Practices' has been completed and published.",
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    isRead: true,
  },
  {
    id: "10",
    type: "ORGANIZATION_INVITATION",
    title: "Organization Invitation",
    summary: "You have been invited to join 'Tech Innovation Hub' organization.",
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    isRead: false,
  },
  {
    id: "11",
    type: "ORGANIZATION_MEMBER_ADDED",
    title: "New Member Added",
    summary: "Alice Johnson has been added to your organization 'Digital Solutions Inc'.",
    timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    isRead: true,
  },
  {
    id: "12",
    type: "ORGANIZATION_DOCUMENT_SUBMITTED",
    title: "Document Submitted for Review",
    summary: "New document 'Annual Financial Report 2024' submitted by Finance Team.",
    timestamp: new Date(Date.now() - 18000000).toISOString(), // 5 hours ago
    isRead: false,
  },
];

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

export const mockNotificationDB = {
  list(): Notification[] {
    return _notifications.slice().reverse(); // Most recent first
  },
  markAsRead(id: string): void {
    const notif = _notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
  },
  getUnreadCount(): number {
    return _notifications.filter((n) => !n.isRead).length;
  },
};
