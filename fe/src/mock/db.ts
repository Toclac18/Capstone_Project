// Import library functions and types from separate file
import {
  getLibrary as getLibraryFromMock,
  updateDocument as updateLibraryDoc,
  deleteDocument as deleteLibraryDoc,
  mockLibraryDocuments,
  type LibraryDocument,
  type LibraryQueryParams,
  type LibraryResponse,
  type UpdateDocumentRequest,
} from "./library";

// Re-export library types and data for backward compatibility
export type { LibraryDocument, LibraryQueryParams, LibraryResponse, UpdateDocumentRequest };
export { mockLibraryDocuments };

// Re-export reviewer functions only (types are exported from types/review.ts)
export {
  getReviewDocuments,
  getReviewRequests,
  getReviewHistory,
  resetMockReviewData,
} from "./review-list";

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

// Mock Profile Data
export type UserRole =
  | "READER"
  | "REVIEWER"
  | "ORGANIZATION"
  | "BUSINESS_ADMIN"
  | "SYSTEM_ADMIN";

export interface ProfileData {
  id: string;
  dateOfBirth?: string;
  role: UserRole;
  email: string;
  fullName?: string;
  username?: string;
  coinBalance?: number;
  status?: string;
  ordid?: string;
  organizationName?: string;
  organizationEmail?: string;
  organizationHotline?: string;
  organizationLogo?: string;
  organizationAddress?: string;
  active?: boolean;
  deleted?: boolean;
}

const _profileData: ProfileData = {
  id: "11111111-1111-1111-1111-111111111111",
  role: "READER",
  email: "reader@example.com",
  fullName: "Reader One",
  username: "reader1",
  dateOfBirth: new Date(1999, 1, 1).toISOString(),
  coinBalance: 120,
  status: "ACTIVE",
  active: true,
  deleted: false,
};

const roleMap: Record<string, ProfileData> = {
  READER: {
    id: "11111111-1111-1111-1111-111111111111",
    role: "READER",
    email: "reader@example.com",
    fullName: "Reader One",
    username: "reader1",
    dateOfBirth: new Date(1999, 1, 1).toISOString(),
    coinBalance: 120,
    status: "ACTIVE",
    active: true,
    deleted: false,
  },
  REVIEWER: {
    id: "22222222-2222-2222-2222-222222222222",
    role: "REVIEWER",
    email: "reviewer@example.com",
    fullName: "Reviewer Jane",
    username: "reviewer_jane",
    ordid: "RV-2025-0001",
    dateOfBirth: new Date(1990, 6, 15).toISOString(),
    coinBalance: 500,
    status: "ACTIVE",
    active: true,
    deleted: false,
  },
  ORGANIZATION: {
    id: "33333333-3333-3333-3333-333333333333",
    role: "ORGANIZATION",
    email: "org-admin@example.com",
    fullName: "John OrgAdmin",
    username: "org_admin",
    organizationName: "Acme Org",
    organizationEmail: "contact@acme.org",
    organizationHotline: "+1 555-0100",
    organizationLogo: "/images/logo/main.svg",
    organizationAddress: "123 Market St, Springfield",
    status: "ACTIVE",
    active: true,
    deleted: false,
  },
  BUSINESS_ADMIN: {
    id: "44444444-4444-4444-4444-444444444444",
    role: "BUSINESS_ADMIN",
    email: "biz-admin@example.com",
    fullName: "Biz Admin",
    username: "biz_admin",
    status: "ACTIVE",
    active: true,
    deleted: false,
  },
  SYSTEM_ADMIN: {
    id: "55555555-5555-5555-5555-555555555555",
    role: "SYSTEM_ADMIN",
    email: "sys-admin@example.com",
    fullName: "System Admin",
    username: "sys_admin",
    status: "ACTIVE",
    active: true,
    deleted: false,
  },
};

export const mockProfileDB = {
  get(role?: string): ProfileData {
    const requestedRole = (role || _profileData.role).toUpperCase();
    const baseProfile = roleMap[requestedRole] || roleMap.READER;
    // Merge _profileData trước, rồi baseProfile sau để baseProfile override và giữ các updates
    return { ..._profileData, ...baseProfile };
  },
  update(data: Partial<ProfileData>): ProfileData {
    Object.assign(_profileData, data);
    return { ..._profileData };
  },
  clear(): void {
    Object.assign(_profileData, roleMap.READER);
  },
};

// ---------------- Organization Admin Mock ----------------
export type OrganizationInfo = {
  id: string;
  name: string;
  type: string;
  registrationNumber: string;
  certificateUpload?: string | null;
  email: string;
  createdAt: string;
  logo?: string | null;
  deleted?: boolean;
};

const _organizationInfo: OrganizationInfo = {
  id: "org-admin-1",
  name: "Tech Innovation Hub",
  type: "NON-PROFIT",
  registrationNumber: "REG-2024-001234",
  certificateUpload: "https://example.com/certificates/tech-innovation-hub-cert.pdf",
  email: "admin@innovation.example.org",
  createdAt: "2024-01-15T10:30:00Z",
  logo: null,
};

export const mockOrganizationAdminDB = {
  get(): OrganizationInfo {
    return { ..._organizationInfo };
  },
  update(data: Partial<OrganizationInfo>): OrganizationInfo {
    Object.assign(_organizationInfo, data);
    return { ..._organizationInfo };
  },
  delete(): void {
    // Mark as deleted (in real scenario, this would update the database)
    _organizationInfo.deleted = true;
  },
};

// ---------------- Business Admin Tags Mock ----------------
import type { Tag as BusinessAdminTag, TagStatus } from "@/types/document-tag";
import type { Domain as BusinessAdminDomain } from "@/types/document-domain";
import type { DocumentType as BusinessAdminType } from "@/types/document-type";
import type { Specialization as BusinessAdminSpecialization } from "@/types/document-specialization";

const _businessAdminTags: BusinessAdminTag[] = [
  {
    id: "tag-1",
    name: "Machine Learning",
    status: "ACTIVE",
    createdDate: "2025-01-15T10:00:00Z",
  },
  {
    id: "tag-2",
    name: "Artificial Intelligence",
    status: "ACTIVE",
    createdDate: "2025-01-16T11:00:00Z",
  },
  {
    id: "tag-3",
    name: "Data Science",
    status: "ACTIVE",
    createdDate: "2025-01-17T12:00:00Z",
  },
  {
    id: "tag-4",
    name: "Web Development",
    status: "ACTIVE",
    createdDate: "2025-01-18T13:00:00Z",
  },
  {
    id: "tag-5",
    name: "Software Engineering",
    status: "ACTIVE",
    createdDate: "2025-01-19T14:00:00Z",
  },
  {
    id: "tag-6",
    name: "Algorithms",
    status: "ACTIVE",
    createdDate: "2025-01-20T15:00:00Z",
  },
  {
    id: "tag-7",
    name: "Database",
    status: "INACTIVE",
    createdDate: "2025-01-21T16:00:00Z",
  },
  {
    id: "tag-8",
    name: "Security",
    status: "ACTIVE",
    createdDate: "2025-01-22T17:00:00Z",
  },
  {
    id: "tag-9",
    name: "Cloud Computing",
    status: "ACTIVE",
    createdDate: "2025-01-23T18:00:00Z",
  },
  {
    id: "tag-10",
    name: "DevOps",
    status: "ACTIVE",
    createdDate: "2025-01-24T19:00:00Z",
  },
  {
    id: "tag-11",
    name: "Mobile Development",
    status: "ACTIVE",
    createdDate: "2025-01-25T20:00:00Z",
  },
  {
    id: "tag-12",
    name: "Blockchain",
    status: "INACTIVE",
    createdDate: "2025-01-26T21:00:00Z",
  },
  {
    id: "tag-13",
    name: "Cybersecurity",
    status: "PENDING",
    createdDate: "2025-01-27T10:00:00Z",
  },
  {
    id: "tag-14",
    name: "Quantum Computing",
    status: "PENDING",
    createdDate: "2025-01-28T11:00:00Z",
  },
  {
    id: "tag-15",
    name: "Internet of Things",
    status: "PENDING",
    createdDate: "2025-01-29T12:00:00Z",
  },
];

export const mockTagsDB = {
  list(params?: {
    search?: string;
    status?: TagStatus;
    dateFrom?: string;
    dateTo?: string;
  }): BusinessAdminTag[] {
    let filtered = [..._businessAdminTags];

    // Filter by search
    if (params?.search) {
      const searchLower = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (tag) =>
          tag.name.toLowerCase().includes(searchLower) ||
          tag.id.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (params?.status) {
      filtered = filtered.filter((tag) => tag.status === params.status);
    }

    // Filter by date range
    if (params?.dateFrom) {
      const fromDate = new Date(params.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((tag) => {
        const tagDate = new Date(tag.createdDate);
        tagDate.setHours(0, 0, 0, 0);
        return tagDate >= fromDate;
      });
    }

    if (params?.dateTo) {
      const toDate = new Date(params.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((tag) => {
        const tagDate = new Date(tag.createdDate);
        tagDate.setHours(0, 0, 0, 0);
        return tagDate <= toDate;
      });
    }

    return filtered;
  },
  get(id: string): BusinessAdminTag | undefined {
    return _businessAdminTags.find((tag) => tag.id === id);
  },
  create(data: { name: string }): BusinessAdminTag {
    // Check for duplicate name (case-insensitive)
    const existingTag = _businessAdminTags.find(
      (tag) => tag.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    );

    if (existingTag) {
      throw new Error("This tag name already exists. Please choose another name.");
    }

    // Validate name is not empty
    if (!data.name || !data.name.trim()) {
      throw new Error("Tag name cannot be empty.");
    }

    const newTag: BusinessAdminTag = {
      id: `tag-${Date.now()}`,
      name: data.name.trim(),
      status: "ACTIVE",
      createdDate: new Date().toISOString(),
    };

    _businessAdminTags.unshift(newTag);
    return newTag;
  },
  update(id: string, data: { name?: string; status?: TagStatus }): BusinessAdminTag {
    const tagIndex = _businessAdminTags.findIndex((tag) => tag.id === id);

    if (tagIndex === -1) {
      throw new Error(`Tag with id ${id} not found`);
    }

    const existingTag = _businessAdminTags[tagIndex];

    // Check for duplicate name if name is being updated
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (trimmedName !== existingTag.name) {
        const duplicateTag = _businessAdminTags.find(
          (tag) =>
            tag.id !== id &&
            tag.name.toLowerCase().trim() === trimmedName.toLowerCase()
        );

        if (duplicateTag) {
          throw new Error("This tag name already exists. Please choose another name.");
        }
      }
    }

    // Validate name is not empty if provided
    if (data.name !== undefined && (!data.name || !data.name.trim())) {
      throw new Error("Tag name cannot be empty.");
    }

    const updatedTag: BusinessAdminTag = {
      ...existingTag,
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.status !== undefined && { status: data.status }),
    };

    _businessAdminTags[tagIndex] = updatedTag;
    return updatedTag;
  },
  delete(id: string): void {
    const tagIndex = _businessAdminTags.findIndex((tag) => tag.id === id);

    if (tagIndex === -1) {
      throw new Error(`Tag with id ${id} not found`);
    }

    _businessAdminTags.splice(tagIndex, 1);
  },
  approve(id: string): BusinessAdminTag {
    const tagIndex = _businessAdminTags.findIndex((tag) => tag.id === id);

    if (tagIndex === -1) {
      throw new Error(`Tag with id ${id} not found`);
    }

    const tag = _businessAdminTags[tagIndex];

    if (tag.status !== "PENDING") {
      throw new Error("Only pending tags can be approved");
    }

    const updatedTag: BusinessAdminTag = {
      ...tag,
      status: "ACTIVE",
    };

    _businessAdminTags[tagIndex] = updatedTag;
    return updatedTag;
  },
  reset(): void {
    _businessAdminTags.length = 0;
    _businessAdminTags.push(
      {
        id: "tag-1",
        name: "Machine Learning",
        status: "ACTIVE",
        createdDate: "2025-01-15T10:00:00Z",
      },
      {
        id: "tag-2",
        name: "Artificial Intelligence",
        status: "ACTIVE",
        createdDate: "2025-01-16T11:00:00Z",
      },
      {
        id: "tag-3",
        name: "Data Science",
        status: "ACTIVE",
        createdDate: "2025-01-17T12:00:00Z",
      },
      {
        id: "tag-4",
        name: "Web Development",
        status: "ACTIVE",
        createdDate: "2025-01-18T13:00:00Z",
      },
      {
        id: "tag-5",
        name: "Software Engineering",
        status: "ACTIVE",
        createdDate: "2025-01-19T14:00:00Z",
      },
      {
        id: "tag-6",
        name: "Algorithms",
        status: "ACTIVE",
        createdDate: "2025-01-20T15:00:00Z",
      },
      {
        id: "tag-7",
        name: "Database",
        status: "INACTIVE",
        createdDate: "2025-01-21T16:00:00Z",
      },
      {
        id: "tag-8",
        name: "Security",
        status: "ACTIVE",
        createdDate: "2025-01-22T17:00:00Z",
      },
      {
        id: "tag-9",
        name: "Cloud Computing",
        status: "ACTIVE",
        createdDate: "2025-01-23T18:00:00Z",
      },
      {
        id: "tag-10",
        name: "DevOps",
        status: "ACTIVE",
        createdDate: "2025-01-24T19:00:00Z",
      },
      {
        id: "tag-11",
        name: "Mobile Development",
        status: "ACTIVE",
        createdDate: "2025-01-25T20:00:00Z",
      },
      {
        id: "tag-12",
        name: "Blockchain",
        status: "INACTIVE",
        createdDate: "2025-01-26T21:00:00Z",
      },
      {
        id: "tag-13",
        name: "Cybersecurity",
        status: "PENDING",
        createdDate: "2025-01-27T10:00:00Z",
      },
      {
        id: "tag-14",
        name: "Quantum Computing",
        status: "PENDING",
        createdDate: "2025-01-28T11:00:00Z",
      },
      {
        id: "tag-15",
        name: "Internet of Things",
        status: "PENDING",
        createdDate: "2025-01-29T12:00:00Z",
      }
    );
  },
};

// ---------------- Business Admin Domains Mock ----------------
const _businessAdminDomains: BusinessAdminDomain[] = [
  {
    id: "domain-1",
    name: "Computer Science",
    createdDate: "2025-01-10T10:00:00Z",
  },
  {
    id: "domain-2",
    name: "Mathematics",
    createdDate: "2025-01-11T11:00:00Z",
  },
  {
    id: "domain-3",
    name: "Physics",
    createdDate: "2025-01-12T12:00:00Z",
  },
  {
    id: "domain-4",
    name: "Biology",
    createdDate: "2025-01-13T13:00:00Z",
  },
  {
    id: "domain-5",
    name: "Chemistry",
    createdDate: "2025-01-14T14:00:00Z",
  },
  {
    id: "domain-6",
    name: "Engineering",
    createdDate: "2025-01-15T15:00:00Z",
  },
  {
    id: "domain-7",
    name: "Medicine",
    createdDate: "2025-01-16T16:00:00Z",
  },
  {
    id: "domain-8",
    name: "Economics",
    createdDate: "2025-01-17T17:00:00Z",
  },
  {
    id: "domain-9",
    name: "Psychology",
    createdDate: "2025-01-18T18:00:00Z",
  },
  {
    id: "domain-10",
    name: "Literature",
    createdDate: "2025-01-19T19:00:00Z",
  },
];

export const mockDomainsDB = {
  list(params?: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): BusinessAdminDomain[] {
    let filtered = [..._businessAdminDomains];

    // Filter by search
    if (params?.search) {
      const searchLower = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (domain) =>
          domain.name.toLowerCase().includes(searchLower) ||
          domain.id.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (params?.dateFrom) {
      const fromDate = new Date(params.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((domain) => {
        const domainDate = new Date(domain.createdDate);
        domainDate.setHours(0, 0, 0, 0);
        return domainDate >= fromDate;
      });
    }

    if (params?.dateTo) {
      const toDate = new Date(params.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((domain) => {
        const domainDate = new Date(domain.createdDate);
        domainDate.setHours(0, 0, 0, 0);
        return domainDate <= toDate;
      });
    }

    return filtered;
  },
  get(id: string): BusinessAdminDomain | undefined {
    return _businessAdminDomains.find((domain) => domain.id === id);
  },
  create(data: { name: string }): BusinessAdminDomain {
    // Check for duplicate name (case-insensitive)
    const existingDomain = _businessAdminDomains.find(
      (domain) => domain.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    );

    if (existingDomain) {
      throw new Error("Domain name already in use. Please choose another name.");
    }

    // Validate name is not empty
    if (!data.name || !data.name.trim()) {
      throw new Error("Domain name cannot be empty.");
    }

    const newDomain: BusinessAdminDomain = {
      id: `domain-${Date.now()}`,
      name: data.name.trim(),
      createdDate: new Date().toISOString(),
    };

    _businessAdminDomains.unshift(newDomain);
    return newDomain;
  },
  update(id: string, data: { name?: string }): BusinessAdminDomain {
    const domainIndex = _businessAdminDomains.findIndex((domain) => domain.id === id);

    if (domainIndex === -1) {
      throw new Error(`Domain with id ${id} not found`);
    }

    const existingDomain = _businessAdminDomains[domainIndex];

    // Check for duplicate name if name is being updated
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (trimmedName !== existingDomain.name) {
        const duplicateDomain = _businessAdminDomains.find(
          (domain) =>
            domain.id !== id &&
            domain.name.toLowerCase().trim() === trimmedName.toLowerCase()
        );

        if (duplicateDomain) {
          throw new Error("Domain name already in use. Please choose another name.");
        }
      }

      // Validate name is not empty
      if (!trimmedName) {
        throw new Error("Domain name cannot be empty.");
      }

      existingDomain.name = trimmedName;
    }

    return existingDomain;
  },
  delete(id: string): void {
    const domainIndex = _businessAdminDomains.findIndex((domain) => domain.id === id);

    if (domainIndex === -1) {
      throw new Error(`Domain with id ${id} not found`);
    }

    _businessAdminDomains.splice(domainIndex, 1);
  },
  reset(): void {
    _businessAdminDomains.length = 0;
    _businessAdminDomains.push(
      {
        id: "domain-1",
        name: "Computer Science",
        createdDate: "2025-01-10T10:00:00Z",
      },
      {
        id: "domain-2",
        name: "Mathematics",
        createdDate: "2025-01-11T11:00:00Z",
      },
      {
        id: "domain-3",
        name: "Physics",
        createdDate: "2025-01-12T12:00:00Z",
      },
      {
        id: "domain-4",
        name: "Biology",
        createdDate: "2025-01-13T13:00:00Z",
      },
      {
        id: "domain-5",
        name: "Chemistry",
        createdDate: "2025-01-14T14:00:00Z",
      },
      {
        id: "domain-6",
        name: "Engineering",
        createdDate: "2025-01-15T15:00:00Z",
      },
      {
        id: "domain-7",
        name: "Medicine",
        createdDate: "2025-01-16T16:00:00Z",
      },
      {
        id: "domain-8",
        name: "Economics",
        createdDate: "2025-01-17T17:00:00Z",
      },
      {
        id: "domain-9",
        name: "Psychology",
        createdDate: "2025-01-18T18:00:00Z",
      },
      {
        id: "domain-10",
        name: "Literature",
        createdDate: "2025-01-19T19:00:00Z",
      }
    );
  },
};

// ---------------- Business Admin Types Mock ----------------
const _businessAdminTypes: BusinessAdminType[] = [
  {
    id: "type-1",
    name: "Research Paper",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "type-2",
    name: "Article",
    createdAt: "2025-01-11T11:00:00Z",
    updatedAt: "2025-01-11T11:00:00Z",
  },
  {
    id: "type-3",
    name: "Book",
    createdAt: "2025-01-12T12:00:00Z",
    updatedAt: "2025-01-12T12:00:00Z",
  },
  {
    id: "type-4",
    name: "Report",
    createdAt: "2025-01-13T13:00:00Z",
    updatedAt: "2025-01-13T13:00:00Z",
  },
  {
    id: "type-5",
    name: "Thesis",
    createdAt: "2025-01-14T14:00:00Z",
    updatedAt: "2025-01-14T14:00:00Z",
  },
  {
    id: "type-6",
    name: "Tutorial",
    createdAt: "2025-01-15T15:00:00Z",
    updatedAt: "2025-01-15T15:00:00Z",
  },
  {
    id: "type-7",
    name: "Technical Report",
    createdAt: "2025-01-16T16:00:00Z",
    updatedAt: "2025-01-16T16:00:00Z",
  },
  {
    id: "type-8",
    name: "Case Study",
    createdAt: "2025-01-17T17:00:00Z",
    updatedAt: "2025-01-17T17:00:00Z",
  },
  {
    id: "type-9",
    name: "Review",
    createdAt: "2025-01-18T18:00:00Z",
    updatedAt: "2025-01-18T18:00:00Z",
  },
  {
    id: "type-10",
    name: "Conference Paper",
    createdAt: "2025-01-19T19:00:00Z",
    updatedAt: "2025-01-19T19:00:00Z",
  },
];

export const mockTypesDB = {
  list(params?: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): BusinessAdminType[] {
    let filtered = [..._businessAdminTypes];

    // Filter by search
    if (params?.search) {
      const searchLower = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (type) =>
          type.name.toLowerCase().includes(searchLower) ||
          type.id.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (params?.dateFrom) {
      const fromDate = new Date(params.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((type) => {
        if (!type.createdAt) return false;
        const typeDate = new Date(type.createdAt);
        typeDate.setHours(0, 0, 0, 0);
        return typeDate >= fromDate;
      });
    }

    if (params?.dateTo) {
      const toDate = new Date(params.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((type) => {
        if (!type.createdAt) return false;
        const typeDate = new Date(type.createdAt);
        typeDate.setHours(0, 0, 0, 0);
        return typeDate <= toDate;
      });
    }

    return filtered;
  },
  get(id: string): BusinessAdminType | undefined {
    return _businessAdminTypes.find((type) => type.id === id);
  },
  create(data: { name: string }): BusinessAdminType {
    // Check for duplicate name (case-insensitive)
    const existingType = _businessAdminTypes.find(
      (type) => type.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    );

    if (existingType) {
      throw new Error("Type name already in use. Please choose another name.");
    }

    // Validate name is not empty
    if (!data.name || !data.name.trim()) {
      throw new Error("Type name cannot be empty.");
    }

    const now = new Date().toISOString();
    const newType: BusinessAdminType = {
      id: `type-${Date.now()}`,
      name: data.name.trim(),
      createdAt: now,
      updatedAt: now,
    };

    _businessAdminTypes.unshift(newType);
    return newType;
  },
  update(id: string, data: { name?: string }): BusinessAdminType {
    const typeIndex = _businessAdminTypes.findIndex((type) => type.id === id);

    if (typeIndex === -1) {
      throw new Error(`Type with id ${id} not found`);
    }

    const existingType = _businessAdminTypes[typeIndex];

    // Check for duplicate name if name is being updated
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (trimmedName !== existingType.name) {
        const duplicateType = _businessAdminTypes.find(
          (type) =>
            type.id !== id &&
            type.name.toLowerCase().trim() === trimmedName.toLowerCase()
        );

        if (duplicateType) {
          throw new Error("Type name already in use. Please choose another name.");
        }
      }

      // Validate name is not empty
      if (!trimmedName) {
        throw new Error("Type name cannot be empty.");
      }

      existingType.name = trimmedName;
      existingType.updatedAt = new Date().toISOString();
    }

    return existingType;
  },
  reset(): void {
    _businessAdminTypes.length = 0;
    _businessAdminTypes.push(
      {
        id: "type-1",
        name: "Research Paper",
        createdAt: "2025-01-10T10:00:00Z",
        updatedAt: "2025-01-10T10:00:00Z",
      },
      {
        id: "type-2",
        name: "Article",
        createdAt: "2025-01-11T11:00:00Z",
        updatedAt: "2025-01-11T11:00:00Z",
      },
      {
        id: "type-3",
        name: "Book",
        createdAt: "2025-01-12T12:00:00Z",
        updatedAt: "2025-01-12T12:00:00Z",
      },
      {
        id: "type-4",
        name: "Report",
        createdAt: "2025-01-13T13:00:00Z",
        updatedAt: "2025-01-13T13:00:00Z",
      },
      {
        id: "type-5",
        name: "Thesis",
        createdAt: "2025-01-14T14:00:00Z",
        updatedAt: "2025-01-14T14:00:00Z",
      },
      {
        id: "type-6",
        name: "Tutorial",
        createdAt: "2025-01-15T15:00:00Z",
        updatedAt: "2025-01-15T15:00:00Z",
      },
      {
        id: "type-7",
        name: "Technical Report",
        createdAt: "2025-01-16T16:00:00Z",
        updatedAt: "2025-01-16T16:00:00Z",
      },
      {
        id: "type-8",
        name: "Case Study",
        createdAt: "2025-01-17T17:00:00Z",
        updatedAt: "2025-01-17T17:00:00Z",
      },
      {
        id: "type-9",
        name: "Review",
        createdAt: "2025-01-18T18:00:00Z",
        updatedAt: "2025-01-18T18:00:00Z",
      },
      {
        id: "type-10",
        name: "Conference Paper",
        createdAt: "2025-01-19T19:00:00Z",
        updatedAt: "2025-01-19T19:00:00Z",
      }
    );
  },
};

// ---------------- Business Admin Specializations Mock ----------------
const _businessAdminSpecializations: BusinessAdminSpecialization[] = [
  {
    id: "spec-1",
    name: "Software Engineering",
    domainId: "domain-1",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "spec-2",
    name: "Artificial Intelligence",
    domainId: "domain-1",
    createdAt: "2025-01-11T11:00:00Z",
    updatedAt: "2025-01-11T11:00:00Z",
  },
  {
    id: "spec-3",
    name: "Data Science",
    domainId: "domain-1",
    createdAt: "2025-01-12T12:00:00Z",
    updatedAt: "2025-01-12T12:00:00Z",
  },
  {
    id: "spec-4",
    name: "Cybersecurity",
    domainId: "domain-1",
    createdAt: "2025-01-13T13:00:00Z",
    updatedAt: "2025-01-13T13:00:00Z",
  },
  {
    id: "spec-5",
    name: "Algebra",
    domainId: "domain-2",
    createdAt: "2025-01-14T14:00:00Z",
    updatedAt: "2025-01-14T14:00:00Z",
  },
  {
    id: "spec-6",
    name: "Calculus",
    domainId: "domain-2",
    createdAt: "2025-01-15T15:00:00Z",
    updatedAt: "2025-01-15T15:00:00Z",
  },
  {
    id: "spec-7",
    name: "Statistics",
    domainId: "domain-2",
    createdAt: "2025-01-16T16:00:00Z",
    updatedAt: "2025-01-16T16:00:00Z",
  },
  {
    id: "spec-8",
    name: "Quantum Physics",
    domainId: "domain-3",
    createdAt: "2025-01-17T17:00:00Z",
    updatedAt: "2025-01-17T17:00:00Z",
  },
  {
    id: "spec-9",
    name: "Thermodynamics",
    domainId: "domain-3",
    createdAt: "2025-01-18T18:00:00Z",
    updatedAt: "2025-01-18T18:00:00Z",
  },
  {
    id: "spec-10",
    name: "Molecular Biology",
    domainId: "domain-4",
    createdAt: "2025-01-19T19:00:00Z",
    updatedAt: "2025-01-19T19:00:00Z",
  },
];

export const mockSpecializationsDB = {
  list(params: { domainId: string; search?: string }): BusinessAdminSpecialization[] {
    let filtered = _businessAdminSpecializations.filter(
      (spec) => spec.domainId === params.domainId
    );

    // Filter by search
    if (params?.search) {
      const searchLower = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (spec) =>
          spec.name.toLowerCase().includes(searchLower) ||
          spec.id.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  },
  get(id: string): BusinessAdminSpecialization | undefined {
    return _businessAdminSpecializations.find((spec) => spec.id === id);
  },
  create(data: { name: string; domainId: string }): BusinessAdminSpecialization {
    // Check for duplicate name in the same domain (case-insensitive)
    const existingSpec = _businessAdminSpecializations.find(
      (spec) =>
        spec.domainId === data.domainId &&
        spec.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    );

    if (existingSpec) {
      throw new Error("Specialization already exists in this domain.");
    }

    // Validate name is not empty
    if (!data.name || !data.name.trim()) {
      throw new Error("Specialization name cannot be empty.");
    }

    const now = new Date().toISOString();
    const newSpec: BusinessAdminSpecialization = {
      id: `spec-${Date.now()}`,
      name: data.name.trim(),
      domainId: data.domainId,
      createdAt: now,
      updatedAt: now,
    };

    _businessAdminSpecializations.unshift(newSpec);
    return newSpec;
  },
  update(id: string, data: { name?: string }): BusinessAdminSpecialization {
    const specIndex = _businessAdminSpecializations.findIndex((spec) => spec.id === id);

    if (specIndex === -1) {
      throw new Error(`Specialization with id ${id} not found`);
    }

    const existingSpec = _businessAdminSpecializations[specIndex];

    // Check for duplicate name if name is being updated
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (trimmedName !== existingSpec.name) {
        const duplicateSpec = _businessAdminSpecializations.find(
          (spec) =>
            spec.id !== id &&
            spec.domainId === existingSpec.domainId &&
            spec.name.toLowerCase().trim() === trimmedName.toLowerCase()
        );

        if (duplicateSpec) {
          throw new Error("Specialization already exists in this domain.");
        }
      }

      // Validate name is not empty
      if (!trimmedName) {
        throw new Error("Specialization name cannot be empty.");
      }

      existingSpec.name = trimmedName;
      existingSpec.updatedAt = new Date().toISOString();
    }

    return existingSpec;
  },
  delete(id: string): void {
    const specIndex = _businessAdminSpecializations.findIndex((spec) => spec.id === id);

    if (specIndex === -1) {
      throw new Error(`Specialization with id ${id} not found`);
    }

    _businessAdminSpecializations.splice(specIndex, 1);
  },
  reset(): void {
    _businessAdminSpecializations.length = 0;
    _businessAdminSpecializations.push(
      {
        id: "spec-1",
        name: "Software Engineering",
        domainId: "domain-1",
        createdAt: "2025-01-10T10:00:00Z",
        updatedAt: "2025-01-10T10:00:00Z",
      },
      {
        id: "spec-2",
        name: "Artificial Intelligence",
        domainId: "domain-1",
        createdAt: "2025-01-11T11:00:00Z",
        updatedAt: "2025-01-11T11:00:00Z",
      },
      {
        id: "spec-3",
        name: "Data Science",
        domainId: "domain-1",
        createdAt: "2025-01-12T12:00:00Z",
        updatedAt: "2025-01-12T12:00:00Z",
      },
      {
        id: "spec-4",
        name: "Cybersecurity",
        domainId: "domain-1",
        createdAt: "2025-01-13T13:00:00Z",
        updatedAt: "2025-01-13T13:00:00Z",
      },
      {
        id: "spec-5",
        name: "Algebra",
        domainId: "domain-2",
        createdAt: "2025-01-14T14:00:00Z",
        updatedAt: "2025-01-14T14:00:00Z",
      },
      {
        id: "spec-6",
        name: "Calculus",
        domainId: "domain-2",
        createdAt: "2025-01-15T15:00:00Z",
        updatedAt: "2025-01-15T15:00:00Z",
      },
      {
        id: "spec-7",
        name: "Statistics",
        domainId: "domain-2",
        createdAt: "2025-01-16T16:00:00Z",
        updatedAt: "2025-01-16T16:00:00Z",
      },
      {
        id: "spec-8",
        name: "Quantum Physics",
        domainId: "domain-3",
        createdAt: "2025-01-17T17:00:00Z",
        updatedAt: "2025-01-17T17:00:00Z",
      },
      {
        id: "spec-9",
        name: "Thermodynamics",
        domainId: "domain-3",
        createdAt: "2025-01-18T18:00:00Z",
        updatedAt: "2025-01-18T18:00:00Z",
      },
      {
        id: "spec-10",
        name: "Molecular Biology",
        domainId: "domain-4",
        createdAt: "2025-01-19T19:00:00Z",
        updatedAt: "2025-01-19T19:00:00Z",
      }
    );
  },
};

// ---------------- Organizations Mock ----------------
export type OrganizationSummary = {
  id: string;
  name: string;
  type: string;
  joinDate: string;
  logo: string | null;
};

export type OrganizationDetail = {
  id: string;
  name: string;
  type: string;
  email: string;
  hotline: string;
  logo: string | null;
  address: string;
  joinDate: string;
  // trimmed: no admin/active/deleted
};

const _organizations: OrganizationDetail[] = [
  {
    id: "org-1",
    name: "Tech Innovation Hub",
    type: "NON-PROFIT",
    email: "info@innovation.example.org",
    hotline: "+1 (555) 010-2000",
    logo: null,
    address: "100 Innovation Way, Metropolis",
    joinDate: "2024-01-15T00:00:00Z",
  },
  {
    id: "org-2",
    name: "Digital Solutions Inc",
    type: "COMPANY",
    email: "contact@digital.example.com",
    hotline: "+1 (555) 010-2000",
    logo: null,
    address: "200 Market St, Springfield",
    joinDate: "2024-03-20T00:00:00Z",
  },
];

export const mockOrganizationsDB = {
  list(): { items: OrganizationSummary[]; total: number } {
    const items: OrganizationSummary[] = _organizations.map(({ id, name, type, joinDate, logo }) => ({
      id,
      name,
      type,
      joinDate,
      logo,
    }));
    return { items, total: items.length };
  },
  get(id: string): OrganizationDetail | undefined {
    return _organizations.find((o) => o.id === id);
  },
  leave(id: string): boolean {
    const idx = _organizations.findIndex((o) => o.id === id);
    if (idx === -1) return false;
    _organizations.splice(idx, 1);
    return true;
  },
};

// ---------------- Upload Documents Mock ----------------
export type DocumentType = {
  id: string;
  name: string;
};

export type Domain = {
  id: string;
  name: string;
  code: number;
};

export type Tag = {
  id: string;
  name: string;
};

const _documentTypes: DocumentType[] = [
  { id: "type-1", name: "Research Paper" },
  { id: "type-2", name: "Article" },
  { id: "type-3", name: "Book" },
  { id: "type-4", name: "Report" },
  { id: "type-5", name: "Thesis" },
];

const _domains: Domain[] = [
  { id: "domain-1", name: "Computer Science", code: 1 },
  { id: "domain-2", name: "Mathematics", code: 2 },
  { id: "domain-3", name: "Physics", code: 3 },
  { id: "domain-4", name: "Biology", code: 4 },
  { id: "domain-5", name: "Chemistry", code: 5 },
  { id: "domain-6", name: "Engineering", code: 6 },
];

const _tags: Tag[] = [
  { id: "tag-1", name: "Machine Learning" },
  { id: "tag-2", name: "Artificial Intelligence" },
  { id: "tag-3", name: "Data Science" },
  { id: "tag-4", name: "Web Development" },
  { id: "tag-5", name: "Software Engineering" },
  { id: "tag-6", name: "Algorithms" },
  { id: "tag-7", name: "Database" },
  { id: "tag-8", name: "Security" },
];

export type Specialization = {
  id: string;
  name: string;
  code: number;
  domainId: string;
};

const _specializations: Specialization[] = [
  // Computer Science specializations
  { id: "spec-1", name: "Machine Learning", code: 101, domainId: "domain-1" },
  { id: "spec-2", name: "Artificial Intelligence", code: 102, domainId: "domain-1" },
  { id: "spec-3", name: "Web Development", code: 103, domainId: "domain-1" },
  { id: "spec-4", name: "Software Engineering", code: 104, domainId: "domain-1" },
  { id: "spec-5", name: "Cybersecurity", code: 105, domainId: "domain-1" },
  // Mathematics specializations
  { id: "spec-6", name: "Algebra", code: 201, domainId: "domain-2" },
  { id: "spec-7", name: "Calculus", code: 202, domainId: "domain-2" },
  { id: "spec-8", name: "Statistics", code: 203, domainId: "domain-2" },
  { id: "spec-9", name: "Geometry", code: 204, domainId: "domain-2" },
  // Physics specializations
  { id: "spec-10", name: "Quantum Physics", code: 301, domainId: "domain-3" },
  { id: "spec-11", name: "Thermodynamics", code: 302, domainId: "domain-3" },
  { id: "spec-12", name: "Mechanics", code: 303, domainId: "domain-3" },
  // Biology specializations
  { id: "spec-13", name: "Molecular Biology", code: 401, domainId: "domain-4" },
  { id: "spec-14", name: "Genetics", code: 402, domainId: "domain-4" },
  { id: "spec-15", name: "Ecology", code: 403, domainId: "domain-4" },
  // Chemistry specializations
  { id: "spec-16", name: "Organic Chemistry", code: 501, domainId: "domain-5" },
  { id: "spec-17", name: "Inorganic Chemistry", code: 502, domainId: "domain-5" },
  { id: "spec-18", name: "Physical Chemistry", code: 503, domainId: "domain-5" },
  // Engineering specializations
  { id: "spec-19", name: "Civil Engineering", code: 601, domainId: "domain-6" },
  { id: "spec-20", name: "Mechanical Engineering", code: 602, domainId: "domain-6" },
  { id: "spec-21", name: "Electrical Engineering", code: 603, domainId: "domain-6" },
];

export type DocumentHistoryStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DocumentHistory = {
  id: string;
  documentName: string;
  uploadDate: string;
  type: string;
  domain: string;
  specialization: string;
  fileSize: number; // in bytes
  status: DocumentHistoryStatus;
  canRequestReview: boolean; // true if rejected and first time (can request re-review)
};

const _uploadHistory: DocumentHistory[] = [
  {
    id: "doc-1",
    documentName: "Introduction to Machine Learning.pdf",
    uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    type: "Research Paper",
    domain: "Computer Science",
    specialization: "Machine Learning",
    fileSize: 2.5 * 1024 * 1024, // 2.5 MB
    status: "APPROVED",
    canRequestReview: false,
  },
  {
    id: "doc-2",
    documentName: "Web Development Best Practices.pdf",
    uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    type: "Article",
    domain: "Computer Science",
    specialization: "Web Development",
    fileSize: 1.8 * 1024 * 1024, // 1.8 MB
    status: "PENDING",
    canRequestReview: false,
  },
  {
    id: "doc-3",
    documentName: "Quantum Physics Fundamentals.docx",
    uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    type: "Research Paper",
    domain: "Physics",
    specialization: "Quantum Physics",
    fileSize: 3.2 * 1024 * 1024, // 3.2 MB
    status: "REJECTED",
    canRequestReview: true, // First time rejected, can request re-review
  },
  {
    id: "doc-4",
    documentName: "Algebra Basics.pdf",
    uploadDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    type: "Book",
    domain: "Mathematics",
    specialization: "Algebra",
    fileSize: 5.1 * 1024 * 1024, // 5.1 MB
    status: "APPROVED",
    canRequestReview: false,
  },
  {
    id: "doc-5",
    documentName: "Molecular Biology Research.docx",
    uploadDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    type: "Research Paper",
    domain: "Biology",
    specialization: "Molecular Biology",
    fileSize: 4.7 * 1024 * 1024, // 4.7 MB
    status: "REJECTED",
    canRequestReview: false, // Already reviewed before
  },
  {
    id: "doc-6",
    documentName: "Software Engineering Principles.pdf",
    uploadDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    type: "Article",
    domain: "Computer Science",
    specialization: "Software Engineering",
    fileSize: 2.9 * 1024 * 1024, // 2.9 MB
    status: "PENDING",
    canRequestReview: false,
  },
  {
    id: "doc-7",
    documentName: "Organic Chemistry Guide.pdf",
    uploadDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    type: "Book",
    domain: "Chemistry",
    specialization: "Organic Chemistry",
    fileSize: 6.3 * 1024 * 1024, // 6.3 MB
    status: "APPROVED",
    canRequestReview: false,
  },
];

// Track re-review requests - in a real app, this would be in a database
const _reReviewRequests = new Set<string>();

export const mockDocumentsDB = {
  getTypes(): DocumentType[] {
    return [..._documentTypes];
  },
  getDomains(): Domain[] {
    return [..._domains];
  },
  getTags(search?: string): Tag[] {
    if (!search) return [..._tags];
    const searchLower = search.toLowerCase();
    return _tags.filter((tag) =>
      tag.name.toLowerCase().includes(searchLower)
    );
  },
  getSpecializations(domainIds: string[]): Specialization[] {
    if (domainIds.length === 0) return [];
    return _specializations.filter((spec) => domainIds.includes(spec.domainId));
  },
  getUploadHistory(params?: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    domain?: string;
    status?: DocumentHistoryStatus;
    page?: number;
    limit?: number;
  }): { documents: DocumentHistory[]; total: number; page: number; limit: number; totalPages: number } {
    let filtered = [..._uploadHistory];

    // Filter by search (document name)
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter((doc) =>
        doc.documentName.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date
    if (params?.dateFrom) {
      const dateFrom = new Date(params.dateFrom);
      filtered = filtered.filter((doc) => new Date(doc.uploadDate) >= dateFrom);
    }
    if (params?.dateTo) {
      const dateTo = new Date(params.dateTo);
      dateTo.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((doc) => new Date(doc.uploadDate) <= dateTo);
    }

    // Filter by type
    if (params?.type) {
      filtered = filtered.filter((doc) => doc.type === params.type);
    }

    // Filter by domain
    if (params?.domain) {
      filtered = filtered.filter((doc) => doc.domain === params.domain);
    }

    // Filter by status
    if (params?.status) {
      filtered = filtered.filter((doc) => doc.status === params.status);
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const documents = filtered.slice(startIndex, endIndex);

    return {
      documents,
      total,
      page,
      limit,
      totalPages,
    };
  },
  requestReReview(documentId: string, _reason: string): { error?: string; status?: number; message?: string } {
    // Check if document exists and is rejected
    const document = _uploadHistory.find((doc) => doc.id === documentId);
    if (!document) {
      return {
        error: "Document not found",
        status: 404,
      };
    }

    if (document.status !== "REJECTED") {
      return {
        error: "Only rejected documents can be requested for re-review",
        status: 400,
      };
    }

    // Check if already requested re-review (41A2)
    if (_reReviewRequests.has(documentId)) {
      return {
        error: "You have already submitted an request for this document.",
        status: 400,
      };
    }

    // Check if canRequestReview is false (already reviewed before)
    if (!document.canRequestReview) {
      return {
        error: "You have already submitted an request for this document.",
        status: 400,
      };
    }

    // Add re-review request
    _reReviewRequests.add(documentId);
    
    // Update document status to PENDING (as per use case: "document status is updated to 'Pending Re-Review'")
    // Note: In a real app, you might want a separate status like "PENDING_RE_REVIEW"
    document.status = "PENDING";
    document.canRequestReview = false;

    return {
      message: "Your request has been submitted and is under review.",
    };
  },
};

// ---------------- Library Mock ----------------
// Library types and data are now in ./library.ts and re-imported above

export const mockLibraryDB = {
  getLibrary(params?: {
    page?: number;
    limit?: number;
    search?: string;
    source?: "UPLOADED" | "REDEEMED";
    type?: string;
    domain?: string;
    dateFrom?: string;
    dateTo?: string;
  }): { documents: LibraryDocument[]; total: number } {
    return getLibraryFromMock(params);
  },

  updateDocument(
    documentId: string,
    data: {
      title: string;
      description: string;
      visibility: "PUBLIC" | "INTERNAL";
      typeId: string;
      domainId: string;
      specializationId: string;
      tagIds: string[];
      newTags?: string[];
      organizationId?: string;
    }
  ): { message: string } {
    return updateLibraryDoc(
      documentId,
      data,
      _documentTypes,
      _domains,
      _specializations,
      _tags,
      _organizations
    );
  },

  deleteDocument(documentId: string): { message: string } {
    return deleteLibraryDoc(documentId);
  },
};
