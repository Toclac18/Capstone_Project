/**
 * Mock API for organizations list.
 * Intercepts GET /api/organizations and returns a deterministic dataset.
 */
export function setupMockOrganizations() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockOrganizationsEnabled) return;
  (globalThis as any)._mockOrganizationsEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.endsWith("/api/organizations") && (!init || init.method === "GET")) {
      const items = [
        {
          id: "org-1",
          name: "Tech Innovation Hub",
          type: "NON-PROFIT",
          joinDate: new Date(2024, 8, 10).toISOString(),
        },
        {
          id: "org-2",
          name: "Digital Solutions Inc",
          type: "COMPANY",
          joinDate: new Date(2025, 0, 3).toISOString(),
        },
      ];
      return new Response(JSON.stringify({ items, total: items.length }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Detail endpoint
    const match = url.match(/\/api\/organizations\/(.+)$/);
    if (match && (!init || init.method === "GET")) {
      const id = decodeURIComponent(match[1]);
      const base = {
        id,
        name: id === "org-2" ? "Digital Solutions Inc" : "Tech Innovation Hub",
        type: id === "org-2" ? "COMPANY" : "NON-PROFIT",
        joinDate: id === "org-2" ? new Date(2025, 0, 3).toISOString() : new Date(2024, 8, 10).toISOString(),
      };
      const detail = {
        ...base,
        description:
          id === "org-2"
            ? "A software company focusing on scalable web platforms."
            : "Community hub that supports innovation and R&D collaborations.",
        memberCount: id === "org-2" ? 120 : 48,
        myRole: "READER",
        website: id === "org-2" ? "https://digital.example.com" : "https://innovation.example.org",
        email: id === "org-2" ? "contact@digital.example.com" : "info@innovation.example.org",
        phone: "+1 (555) 010-2000",
        address: id === "org-2" ? "200 Market St, Springfield" : "100 Innovation Way, Metropolis",
      };
      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };

  console.info("[MOCK] Organizations API enabled (fetch intercepted)");
}

// ---------- Direct Mock Functions for API Routes ----------

const mockOrganizations = [
  {
    id: "org-1",
    name: "Tech Innovation Hub",
    type: "TYPE1",
    email: "info@innovation.example.org",
    hotline: "+1 (555) 010-2000",
    logo: "https://innovation.example.org/logo.png",
    address: "100 Innovation Way, Metropolis",
    registrationNumber: "REG-001",
    status: "ACTIVE",
    adminName: "John Admin",
    adminEmail: "admin@innovation.example.org",
    active: true,
    deleted: false,
    createdAt: new Date(2024, 8, 10).toISOString(),
    updatedAt: new Date(2024, 8, 10).toISOString(),
  },
  {
    id: "org-2",
    name: "Digital Solutions Inc",
    type: "TYPE2",
    email: "contact@digital.example.com",
    hotline: "+1 (555) 010-2000",
    logo: "https://digital.example.com/logo.png",
    address: "200 Market St, Springfield",
    registrationNumber: "REG-002",
    status: "ACTIVE",
    adminName: "Jane Admin",
    adminEmail: "admin@digital.example.com",
    active: true,
    deleted: false,
    createdAt: new Date(2025, 0, 3).toISOString(),
    updatedAt: new Date(2025, 0, 3).toISOString(),
  },
];

/**
 * Get list of organizations (for API routes)
 */
export function mockGetOrganizations(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  let filtered = [...mockOrganizations];

  // Filter by search
  if (params?.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(
      (org) =>
        org.name.toLowerCase().includes(searchLower) ||
        org.email.toLowerCase().includes(searchLower) ||
        org.adminEmail.toLowerCase().includes(searchLower)
    );
  }

  // Filter by type
  if (params?.type) {
    filtered = filtered.filter((org) => org.type === params.type);
  }

  // Filter by status
  if (params?.status) {
    filtered = filtered.filter((org) => org.status === params.status);
  }

  // Filter by date range
  if (params?.dateFrom) {
    const dateFrom = new Date(params.dateFrom).toISOString();
    filtered = filtered.filter(
      (org) => org.createdAt && org.createdAt >= dateFrom
    );
  }
  if (params?.dateTo) {
    // Add time to end of day for dateTo comparison
    const dateTo = new Date(params.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    const dateToISO = dateTo.toISOString();
    filtered = filtered.filter(
      (org) => org.createdAt && org.createdAt <= dateToISO
    );
  }

  // Sort
  const sortBy = params?.sortBy || "createdAt";
  const sortOrder = params?.sortOrder || "desc";
  filtered.sort((a, b) => {
    let aVal: any = (a as any)[sortBy];
    let bVal: any = (b as any)[sortBy];
    
    // Handle undefined/null values
    if (aVal === undefined || aVal === null) aVal = "";
    if (bVal === undefined || bVal === null) bVal = "";
    
    // Handle date strings
    if (sortBy === "createdAt" || sortBy === "updatedAt") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    
    // Handle string comparison
    if (typeof aVal === "string" && typeof bVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    }
    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
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
 * Get organization by ID (for API routes)
 */
export function mockGetOrganizationById(id: string) {
  return mockOrganizations.find((org) => org.id === id) || null;
}

/**
 * Update organization status (for API routes)
 */
export function mockUpdateOrganizationStatus(
  id: string,
  status: string
): { id: string; status: string } | null {
  const org = mockOrganizations.find((o) => o.id === id);
  if (!org) return null;

  return {
    id: org.id,
    status,
  };
}