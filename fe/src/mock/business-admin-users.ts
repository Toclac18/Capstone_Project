// src/mock/business-admin-users.ts
// Mock data for Business Admin User Management

import { UserStatus } from "@/types/user";
import type {
  User,
  UserResponse,
  UserQueryParams,
  CreateUserData,
} from "@/types/user";

// ---------- Seed Data ----------
const seedUsers: User[] = [
  {
    id: "user-1",
    email: "john.doe@example.com",
    name: "John Doe",
    role: "READER",
    status: UserStatus.ACTIVE,
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: "user-2",
    email: "jane.smith@example.com",
    name: "Jane Smith",
    role: "READER",
    status: UserStatus.ACTIVE,
    createdAt: new Date("2024-02-20").toISOString(),
    updatedAt: new Date("2024-02-20").toISOString(),
  },
  {
    id: "user-3",
    email: "reviewer1@example.com",
    name: "Dr. Alice Johnson",
    role: "REVIEWER",
    status: UserStatus.ACTIVE,
    createdAt: new Date("2024-01-10").toISOString(),
    updatedAt: new Date("2024-01-10").toISOString(),
  },
  {
    id: "user-4",
    email: "org.admin@example.com",
    name: "Bob Williams",
    role: "ORGANIZATION",
    status: UserStatus.ACTIVE,
    createdAt: new Date("2024-03-05").toISOString(),
    updatedAt: new Date("2024-03-05").toISOString(),
  },
  {
    id: "user-5",
    email: "pending.user@example.com",
    name: "Pending User",
    role: "READER",
    status: UserStatus.PENDING_VERIFICATION,
    createdAt: new Date("2024-11-20").toISOString(),
    updatedAt: new Date("2024-11-20").toISOString(),
  },
  {
    id: "user-6",
    email: "deactive.user@example.com",
    name: "Deactive User",
    role: "READER",
    status: UserStatus.DEACTIVE,
    createdAt: new Date("2024-06-10").toISOString(),
    updatedAt: new Date("2024-10-15").toISOString(),
  },
  {
    id: "user-7",
    email: "reader2@example.com",
    name: "Sarah Connor",
    role: "READER",
    status: UserStatus.ACTIVE,
    createdAt: new Date("2024-04-12").toISOString(),
    updatedAt: new Date("2024-04-12").toISOString(),
  },
  {
    id: "user-8",
    email: "reviewer2@example.com",
    name: "Dr. Michael Brown",
    role: "REVIEWER",
    status: UserStatus.ACTIVE,
    createdAt: new Date("2024-02-28").toISOString(),
    updatedAt: new Date("2024-02-28").toISOString(),
  },
];

// In-memory storage
let _users: User[] = [...seedUsers];

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
 * Get list of users with filters
 */
export function getUsers(params?: UserQueryParams): UserResponse {
  let filtered = [..._users];

  // Filter by search
  if (params?.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.role.toLowerCase().includes(searchLower)
    );
  }

  // Filter by role
  if (params?.role) {
    filtered = filtered.filter((u) => u.role === params.role);
  }

  // Filter by status
  if (params?.status) {
    filtered = filtered.filter((u) => u.status === params.status);
  }

  // Filter by date range
  if (params?.dateFrom) {
    filtered = filtered.filter((u) => u.createdAt && u.createdAt >= params.dateFrom!);
  }
  if (params?.dateTo) {
    filtered = filtered.filter((u) => u.createdAt && u.createdAt <= params.dateTo!);
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
    users: items,
    total,
    page,
    limit,
  };
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | null {
  return _users.find((u) => u.id === id) || null;
}

/**
 * Create new user
 */
export function createUser(data: CreateUserData): User {
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: data.email,
    name: data.name || data.email.split("@")[0],
    role: data.role || "READER",
    status: UserStatus.PENDING_VERIFICATION,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  _users.push(newUser);
  return newUser;
}

/**
 * Update user status
 */
export function updateUserStatus(id: string, status: UserStatus | string): User | null {
  const index = _users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  _users[index] = {
    ..._users[index],
    status: status as UserStatus,
    updatedAt: nowIso(),
  };

  return _users[index];
}

/**
 * Delete user (soft delete by setting status to DELETED)
 */
export function deleteUser(id: string): boolean {
  const index = _users.findIndex((u) => u.id === id);
  if (index === -1) return false;

  _users[index] = {
    ..._users[index],
    status: UserStatus.DELETED,
    updatedAt: nowIso(),
  };
  return true;
}

/**
 * Reset mock data
 */
export function resetMockUsers() {
  _users = [...seedUsers];
}

