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
    status: "ACTIVE",
    visibility: "PUBLIC",
    isPublic: true,
    isPremium: false,
    viewCount: 1250,
    upvoteCount: 89,
    voteScore: 84,
    createdAt: new Date("2024-01-15").toISOString(),
    updatedAt: new Date("2024-01-15").toISOString(),
    uploader: {
      id: "user-1",
      fullName: "John Doe",
      username: "john.doe",
      avatarUrl: undefined,
    },
    organization: null,
    docTypeName: "Research Paper",
    specializationName: "Machine Learning",
  },
  {
    id: "doc-2",
    title: "Advanced Algorithms in Python",
    status: "ACTIVE",
    visibility: "PUBLIC",
    isPublic: true,
    isPremium: true,
    price: 100,
    viewCount: 890,
    upvoteCount: 120,
    voteScore: 112,
    createdAt: new Date("2024-02-20").toISOString(),
    updatedAt: new Date("2024-02-20").toISOString(),
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
    docTypeName: "Tutorial",
    specializationName: "Software Engineering",
  },
  {
    id: "doc-3",
    title: "Database Design Patterns",
    status: "ACTIVE",
    visibility: "PRIVATE",
    isPublic: false,
    isPremium: false,
    viewCount: 450,
    upvoteCount: 45,
    voteScore: 40,
    createdAt: new Date("2024-03-10").toISOString(),
    updatedAt: new Date("2024-03-10").toISOString(),
    uploader: {
      id: "user-1",
      fullName: "John Doe",
      username: "john.doe",
      avatarUrl: undefined,
    },
    organization: null,
    docTypeName: "Reference Guide",
    specializationName: "Database Systems",
  },
  {
    id: "doc-4",
    title: "React Best Practices 2025",
    status: "ACTIVE",
    visibility: "PUBLIC",
    isPublic: true,
    isPremium: true,
    price: 150,
    viewCount: 2100,
    upvoteCount: 200,
    voteScore: 190,
    createdAt: new Date("2024-04-05").toISOString(),
    updatedAt: new Date("2024-04-05").toISOString(),
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
    docTypeName: "Tutorial",
    specializationName: "Web Development",
  },
  {
    id: "doc-5",
    title: "Deleted Document Example",
    status: "DELETED",
    visibility: "PUBLIC",
    isPublic: true,
    isPremium: false,
    viewCount: 100,
    upvoteCount: 5,
    voteScore: 3,
    createdAt: new Date("2024-01-01").toISOString(),
    updatedAt: new Date("2024-01-01").toISOString(),
    uploader: {
      id: "user-1",
      fullName: "John Doe",
      username: "john.doe",
      avatarUrl: undefined,
    },
    organization: null,
    docTypeName: "Research Paper",
    specializationName: "General",
  },
];

// Mock detail data (extended from list items)
const seedDocumentDetails: Record<string, DocumentDetail> = {
  "doc-1": {
    id: "doc-1",
    title: "Introduction to Machine Learning",
    description: "Comprehensive guide to ML fundamentals",
    visibility: "PUBLIC",
    status: "ACTIVE",
    isPremium: false,
    price: null,
    thumbnailUrl: null,
    pageCount: 50,
    viewCount: 1250,
    upvoteCount: 89,
    downvoteCount: 5,
    voteScore: 84,
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
    docType: {
      id: "type-1",
      name: "Research Paper",
      description: null,
    },
    specialization: {
      id: "spec-1",
      name: "Machine Learning",
      domain: {
        id: "domain-1",
        name: "Computer Science",
      },
    },
    tags: [
      { id: "tag-1", name: "Machine Learning" },
      { id: "tag-2", name: "AI" },
    ],
    adminInfo: {
      commentCount: 15,
      saveCount: 42,
      reportCount: 0,
      purchaseCount: null,
    },
  },
  "doc-2": {
    id: "doc-2",
    title: "Advanced Algorithms in Python",
    description: "Deep dive into algorithm optimization",
    visibility: "PUBLIC",
    status: "ACTIVE",
    isPremium: true,
    price: 100,
    thumbnailUrl: null,
    pageCount: 75,
    viewCount: 890,
    upvoteCount: 120,
    downvoteCount: 8,
    voteScore: 112,
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
    docType: {
      id: "type-2",
      name: "Tutorial",
      description: null,
    },
    specialization: {
      id: "spec-4",
      name: "Software Engineering",
      domain: {
        id: "domain-1",
        name: "Computer Science",
      },
    },
    tags: [
      { id: "tag-3", name: "Algorithms" },
      { id: "tag-4", name: "Python" },
    ],
    adminInfo: {
      commentCount: 28,
      saveCount: 67,
      reportCount: 1,
      purchaseCount: 45,
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

  // Filter by typeId (not supported in mock, would need to check docTypeName)
  // Note: typeId filter is not fully supported in mock data

  // Filter by isPublic
  if (params?.isPublic !== undefined) {
    filtered = filtered.filter((d) => d.isPublic === params.isPublic);
  }

  // Filter by isPremium
  if (params?.isPremium !== undefined) {
    filtered = filtered.filter((d) => d.isPremium === params.isPremium);
  }

  // Filter by status (including DELETED)
  if (params?.status) {
    filtered = filtered.filter((d) => d.status === params.status);
  } else if (params?.deleted === false) {
    // Exclude DELETED when deleted: false
    filtered = filtered.filter((d) => d.status !== "DELETED");
  } else if (params?.deleted === undefined) {
    // Default: exclude deleted
    filtered = filtered.filter((d) => d.status !== "DELETED");
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
    status: "DELETED",
  };

  if (_documentDetails[id]) {
    _documentDetails[id] = {
      ..._documentDetails[id],
      status: "DELETED",
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

