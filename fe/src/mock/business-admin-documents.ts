// src/mock/business-admin-documents.ts
// Mock data for Business Admin Document Management

import type {
  DocumentListItem,
  DocumentDetail,
  DocumentListResponse,
  DocumentQueryParams,
} from "@/types/document-management";

// ---------- Seed Data ----------
const seedDocuments: DocumentListItem[] = [
  {
    id: "doc-1",
    title: "Introduction to Machine Learning",
    isPublic: true,
    isPremium: false,
    viewCount: 1250,
    deleted: false,
    createdAt: new Date("2024-01-15").toISOString(),
    uploader: {
      id: "user-1",
      fullName: "John Doe",
      username: "john.doe",
      avatarUrl: undefined,
    },
    organization: null,
    type: {
      id: "type-1",
      name: "Research Paper",
    },
  },
  {
    id: "doc-2",
    title: "Advanced Algorithms in Python",
    isPublic: true,
    isPremium: true,
    viewCount: 890,
    deleted: false,
    createdAt: new Date("2024-02-20").toISOString(),
    uploader: {
      id: "user-2",
      fullName: "Jane Smith",
      username: "jane.smith",
      avatarUrl: undefined,
    },
    organization: {
      id: "org-1",
      name: "Tech Innovation Hub",
      logo: undefined,
    },
    type: {
      id: "type-2",
      name: "Tutorial",
    },
  },
  {
    id: "doc-3",
    title: "Database Design Patterns",
    isPublic: false,
    isPremium: false,
    viewCount: 450,
    deleted: false,
    createdAt: new Date("2024-03-10").toISOString(),
    uploader: {
      id: "user-1",
      fullName: "John Doe",
      username: "john.doe",
      avatarUrl: undefined,
    },
    organization: null,
    type: {
      id: "type-3",
      name: "Reference Guide",
    },
  },
  {
    id: "doc-4",
    title: "React Best Practices 2025",
    isPublic: true,
    isPremium: true,
    viewCount: 2100,
    deleted: false,
    createdAt: new Date("2024-04-05").toISOString(),
    uploader: {
      id: "user-2",
      fullName: "Jane Smith",
      username: "jane.smith",
      avatarUrl: undefined,
    },
    organization: {
      id: "org-1",
      name: "Tech Innovation Hub",
      logo: undefined,
    },
    type: {
      id: "type-2",
      name: "Tutorial",
    },
  },
  {
    id: "doc-5",
    title: "Deleted Document Example",
    isPublic: true,
    isPremium: false,
    viewCount: 100,
    deleted: true,
    createdAt: new Date("2024-01-01").toISOString(),
    uploader: {
      id: "user-1",
      fullName: "John Doe",
      username: "john.doe",
      avatarUrl: undefined,
    },
    organization: null,
    type: {
      id: "type-1",
      name: "Research Paper",
    },
  },
];

// Mock detail data (extended from list items)
const seedDocumentDetails: Record<string, DocumentDetail> = {
  "doc-1": {
    id: "doc-1",
    title: "Introduction to Machine Learning",
    description: "Comprehensive guide to ML fundamentals",
    file_name: "ml-intro.pdf",
    isPublic: true,
    isPremium: false,
    price: null,
    viewCount: 1250,
    deleted: false,
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
    uploader: {
      id: "user-1",
      fullName: "John Doe",
      username: "john.doe",
      avatarUrl: undefined,
      email: "john.doe@example.com",
      status: "ACTIVE",
    },
    organization: null,
    type: {
      id: "type-1",
      name: "Research Paper",
    },
    specializations: [
      {
        id: "spec-1",
        code: 1,
        name: "Machine Learning",
        domain: {
          id: "domain-1",
          code: 1,
          name: "Computer Science",
        },
      },
    ],
    tags: [
      { id: "tag-1", name: "Machine Learning" },
      { id: "tag-2", name: "AI" },
    ],
    commentCount: 15,
    saveCount: 42,
    upvoteCount: 89,
    downvoteCount: 5,
    reportCount: 0,
    purchaseCount: null,
    reviewer: null,
  },
  "doc-2": {
    id: "doc-2",
    title: "Advanced Algorithms in Python",
    description: "Deep dive into algorithm optimization",
    file_name: "algorithms-python.pdf",
    isPublic: true,
    isPremium: true,
    price: 100,
    viewCount: 890,
    deleted: false,
    createdAt: new Date("2024-02-20").toISOString(),
    updatedAt: new Date("2024-02-20").toISOString(),
    uploader: {
      id: "user-2",
      fullName: "Jane Smith",
      username: "jane.smith",
      avatarUrl: undefined,
      email: "jane.smith@example.com",
      status: "ACTIVE",
    },
    organization: {
      id: "org-1",
      name: "Tech Innovation Hub",
      logo: undefined,
      type: "NON-PROFIT",
      email: "contact@techhub.org",
      status: "ACTIVE",
    },
    type: {
      id: "type-2",
      name: "Tutorial",
    },
    specializations: [
      {
        id: "spec-4",
        code: 4,
        name: "Software Engineering",
        domain: {
          id: "domain-1",
          code: 1,
          name: "Computer Science",
        },
      },
    ],
    tags: [
      { id: "tag-3", name: "Algorithms" },
      { id: "tag-4", name: "Python" },
    ],
    commentCount: 28,
    saveCount: 67,
    upvoteCount: 120,
    downvoteCount: 8,
    reportCount: 1,
    purchaseCount: 45,
    reviewer: {
      id: "user-3",
      fullName: "Dr. Alice Johnson",
      username: "alice.johnson",
      email: "reviewer1@example.com",
    },
  },
};

// In-memory storage
let _documents: DocumentListItem[] = [...seedDocuments];
let _documentDetails: Record<string, DocumentDetail> = { ...seedDocumentDetails };

// ---------- Helper Functions ----------
// function isoWithOffset(d: Date) {
//   const pad = (n: number, l = 2) => String(n).padStart(l, "0");
//   const y = d.getFullYear();
//   const m = pad(d.getMonth() + 1);
//   const day = pad(d.getDate());
//   const hh = pad(d.getHours());
//   const mm = pad(d.getMinutes());
//   const ss = pad(d.getSeconds());
//   const ms = pad(d.getMilliseconds(), 3);
//   const tzo = -d.getTimezoneOffset();
//   const sign = tzo >= 0 ? "+" : "-";
//   const oh = pad(Math.floor(Math.abs(tzo) / 60));
//   const om = pad(Math.abs(tzo) % 60);
//   return `${y}-${m}-${day}T${hh}:${mm}:${ss}.${ms}${sign}${oh}:${om}`;
// }

// ---------- Public API ----------

/**
 * Get list of documents with filters
 */
export function getDocuments(params?: DocumentQueryParams): DocumentListResponse {
  let filtered = [..._documents];

  // Filter by search
  if (params?.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter((d) => d.title.toLowerCase().includes(searchLower));
  }

  // Filter by organizationId
  if (params?.organizationId) {
    filtered = filtered.filter(
      (d) => d.organization?.id === params.organizationId
    );
  }

  // Filter by typeId
  if (params?.typeId) {
    filtered = filtered.filter((d) => d.type.id === params.typeId);
  }

  // Filter by isPublic
  if (params?.isPublic !== undefined) {
    filtered = filtered.filter((d) => d.isPublic === params.isPublic);
  }

  // Filter by isPremium
  if (params?.isPremium !== undefined) {
    filtered = filtered.filter((d) => d.isPremium === params.isPremium);
  }

  // Filter by deleted
  if (params?.deleted !== undefined) {
    filtered = filtered.filter((d) => d.deleted === params.deleted);
  } else {
    // Default: exclude deleted
    filtered = filtered.filter((d) => !d.deleted);
  }

  // Filter by date range
  if (params?.dateFrom) {
    filtered = filtered.filter((d) => d.createdAt >= params.dateFrom!);
  }
  if (params?.dateTo) {
    filtered = filtered.filter((d) => d.createdAt <= params.dateTo!);
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
    documents: items,
    total,
    page,
    limit,
  };
}

/**
 * Get document by ID
 */
export function getDocumentById(id: string): DocumentDetail | null {
  return _documentDetails[id] || null;
}

/**
 * Delete document (soft delete)
 */
export function deleteDocument(id: string): boolean {
  const index = _documents.findIndex((d) => d.id === id);
  if (index === -1) return false;

  _documents[index] = {
    ..._documents[index],
    deleted: true,
  };

  if (_documentDetails[id]) {
    _documentDetails[id] = {
      ..._documentDetails[id],
      deleted: true,
    };
  }

  return true;
}

/**
 * Reset mock data
 */
export function resetMockDocuments() {
  _documents = [...seedDocuments];
  _documentDetails = { ...seedDocumentDetails };
}

