// src/mock/business-admin-organizations.ts
// Mock data for Business Admin Organization Management

import {
  OrganizationStatus,
  OrganizationType,
} from "@/types/organization";
import type {
  Organization,
  OrganizationResponse,
  OrganizationQueryParams,
} from "@/types/organization";

// ---------- Seed Data ----------
const seedOrganizations: Organization[] = [
  {
    id: "org-1",
    name: "Tech Innovation Hub",
    type: OrganizationType.TYPE1,
    email: "contact@techhub.org",
    hotline: "+1 (555) 010-1000",
    logo: "https://via.placeholder.com/100",
    address: "100 Innovation Way, Metropolis",
    registrationNumber: "REG-2024-001",
    status: OrganizationStatus.ACTIVE,
    adminName: "John OrgAdmin",
    adminEmail: "admin@techhub.org",
    active: true,
    deleted: false,
    createdAt: new Date("2024-01-10").toISOString(),
    updatedAt: new Date("2024-01-10").toISOString(),
  },
  {
    id: "org-2",
    name: "Digital Solutions Inc",
    type: OrganizationType.TYPE2,
    email: "contact@digitalsolutions.com",
    hotline: "+1 (555) 010-2000",
    logo: "https://via.placeholder.com/100",
    address: "200 Market St, Springfield",
    registrationNumber: "REG-2024-002",
    status: OrganizationStatus.ACTIVE,
    adminName: "Jane Director",
    adminEmail: "admin@digitalsolutions.com",
    active: true,
    deleted: false,
    createdAt: new Date("2024-02-15").toISOString(),
    updatedAt: new Date("2024-02-15").toISOString(),
  },
  {
    id: "org-3",
    name: "Pending Organization",
    type: OrganizationType.TYPE1,
    email: "contact@pending.org",
    hotline: "+1 (555) 010-3000",
    logo: undefined,
    address: "300 Pending Ave, City",
    registrationNumber: "REG-2024-003",
    status: OrganizationStatus.PENDING_VERIFICATION,
    adminName: "Pending Admin",
    adminEmail: "admin@pending.org",
    active: false,
    deleted: false,
    createdAt: new Date("2024-11-20").toISOString(),
    updatedAt: new Date("2024-11-20").toISOString(),
  },
  {
    id: "org-4",
    name: "Deactive Organization",
    type: OrganizationType.TYPE3,
    email: "contact@deactive.org",
    hotline: "+1 (555) 010-4000",
    logo: undefined,
    address: "400 Deactive St, Town",
    registrationNumber: "REG-2024-004",
    status: OrganizationStatus.DEACTIVE,
    adminName: "Deactive Admin",
    adminEmail: "admin@deactive.org",
    active: false,
    deleted: false,
    createdAt: new Date("2024-05-10").toISOString(),
    updatedAt: new Date("2024-10-15").toISOString(),
  },
  {
    id: "org-5",
    name: "Research Institute",
    type: OrganizationType.TYPE1,
    email: "contact@research.org",
    hotline: "+1 (555) 010-5000",
    logo: "https://via.placeholder.com/100",
    address: "500 Research Blvd, Science City",
    registrationNumber: "REG-2024-005",
    status: OrganizationStatus.ACTIVE,
    adminName: "Dr. Research",
    adminEmail: "admin@research.org",
    active: true,
    deleted: false,
    createdAt: new Date("2024-03-20").toISOString(),
    updatedAt: new Date("2024-03-20").toISOString(),
  },
];

// In-memory storage
let _organizations: Organization[] = [...seedOrganizations];

// ---------- Helper Functions ----------
function isoWithOffset(d: Date) {
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const ms = pad(d.getMilliseconds(), 3);
  const tzo = -d.getTimezoneOffset();
  const sign = tzo >= 0 ? "+" : "-";
  const oh = pad(Math.floor(Math.abs(tzo) / 60));
  const om = pad(Math.abs(tzo) % 60);
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}.${ms}${sign}${oh}:${om}`;
}

function nowIso() {
  return isoWithOffset(new Date());
}

// ---------- Public API ----------

/**
 * Get list of organizations with filters
 */
export function getOrganizations(params?: OrganizationQueryParams): OrganizationResponse {
  let filtered = [..._organizations];

  // Filter by search
  if (params?.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.name.toLowerCase().includes(searchLower) ||
        o.email.toLowerCase().includes(searchLower) ||
        o.adminEmail.toLowerCase().includes(searchLower)
    );
  }

  // Filter by status
  if (params?.status) {
    filtered = filtered.filter((o) => o.status === params.status);
  }

  // Filter by date range
  if (params?.dateFrom) {
    filtered = filtered.filter((o) => o.createdAt >= params.dateFrom!);
  }
  if (params?.dateTo) {
    filtered = filtered.filter((o) => o.createdAt <= params.dateTo!);
  }

  // Sort
  const sortBy = params?.sortBy || "createdAt";
  const sortOrder = params?.sortOrder || "desc";
  filtered.sort((a, b) => {
    const aVal = (a as any)[sortBy] || "";
    const bVal = (b as any)[sortBy] || "";
    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  // Pagination
  const page = params?.page || 1;
  const limit = params?.limit || 10;
  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    organizations: items,
    total,
    page,
    limit,
  };
}

/**
 * Get organization by ID
 */
export function getOrganizationById(id: string): (Organization & { totalMembers?: number; totalDocuments?: number }) | null {
  const org = _organizations.find((o) => o.id === id);
  if (!org) return null;

  return {
    ...org,
    totalMembers: Math.floor(Math.random() * 100) + 10, // Mock data
    totalDocuments: Math.floor(Math.random() * 50) + 5, // Mock data
  };
}

/**
 * Create new organization
 */
export function createOrganization(data: any): Organization {
  const newOrg: Organization = {
    id: `org-${Date.now()}`,
    name: data.name || data.organizationName || "New Organization",
    type: data.type || OrganizationType.TYPE1,
    email: data.email || data.organizationEmail || "",
    hotline: data.hotline || "",
    logo: data.logo,
    address: data.address || "",
    registrationNumber: data.registrationNumber || `REG-${Date.now()}`,
    status: OrganizationStatus.PENDING_VERIFICATION,
    adminName: data.adminName,
    adminEmail: data.adminEmail || data.email || "",
    active: false,
    deleted: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  _organizations.push(newOrg);
  return newOrg;
}

/**
 * Update organization status
 */
export function updateOrganizationStatus(
  id: string,
  status: OrganizationStatus | string
): (Organization & { totalMembers?: number; totalDocuments?: number }) | null {
  const index = _organizations.findIndex((o) => o.id === id);
  if (index === -1) return null;

  _organizations[index] = {
    ..._organizations[index],
    status: status as OrganizationStatus,
    active: status === OrganizationStatus.ACTIVE,
    updatedAt: nowIso(),
  };

  return {
    ..._organizations[index],
    totalMembers: Math.floor(Math.random() * 100) + 10,
    totalDocuments: Math.floor(Math.random() * 50) + 5,
  };
}

/**
 * Delete organization (soft delete)
 */
export function deleteOrganization(id: string): boolean {
  const index = _organizations.findIndex((o) => o.id === id);
  if (index === -1) return false;

  _organizations[index] = {
    ..._organizations[index],
    status: OrganizationStatus.DELETED,
    deleted: true,
    active: false,
    updatedAt: nowIso(),
  };
  return true;
}

/**
 * Reset mock data
 */
export function resetMockOrganizations() {
  _organizations = [...seedOrganizations];
}

