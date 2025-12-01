// Mock data for role management
import type { User } from "@/types/user";

export const mockUsersForRoleManagement: User[] = [
  {
    id: "user-1",
    email: "reader1@example.com",
    name: "John Reader",
    role: "READER",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-2",
    email: "reviewer1@example.com",
    name: "Jane Reviewer",
    role: "REVIEWER",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-3",
    email: "orgadmin1@example.com",
    name: "Bob OrgAdmin",
    role: "ORGANIZATION_ADMIN",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-4",
    email: "business1@example.com",
    name: "Alice Business",
    role: "BUSINESS_ADMIN",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "user-5",
    email: "system1@example.com",
    name: "System Admin",
    role: "SYSTEM_ADMIN",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Generate more mock users
  ...Array.from({ length: 45 }, (_, i) => {
    const roles: Array<"READER" | "REVIEWER" | "ORGANIZATION_ADMIN" | "BUSINESS_ADMIN" | "SYSTEM_ADMIN"> = 
      ["READER", "REVIEWER", "ORGANIZATION_ADMIN", "BUSINESS_ADMIN", "SYSTEM_ADMIN"];
    const role = roles[i % roles.length];
    const statuses: Array<"ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION"> = 
      ["ACTIVE", "INACTIVE", "PENDING_VERIFICATION"];
    const status = statuses[i % statuses.length];
    
    return {
      id: `user-${i + 6}`,
      email: `${role.toLowerCase()}${i + 6}@example.com`,
      name: `${role} User ${i + 6}`,
      role,
      status,
      createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    };
  }),
];


