// src/mock/library.ts
// Mock dataset & helpers for Reader Library (uploaded + purchased documents)
// Compatible with route: src/app/api/reader/library/route.ts

export type LibraryDocument = {
  id: string;
  documentName: string;
  description?: string;
  uploadDate: string;
  type: string;
  domain: string;
  fileSize: number;
  source: "UPLOADED" | "PURCHASED";
  pages: number;
  reads: number;
  visibility: "PUBLIC" | "PRIVATE" | "INTERNAL";
  interest?: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  thumbnailUrl?: string;
  tagIds?: string[];
  organizationId?: string;
};

export type LibraryQueryParams = {
  page?: number;
  limit?: number;
  search?: string;
  source?: "UPLOADED" | "PURCHASED";
  type?: string;
  domain?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type LibraryResponse = {
  documents: LibraryDocument[];
  total: number;
};

export type UpdateDocumentRequest = {
  title: string;
  description: string;
  visibility: "PUBLIC" | "INTERNAL";
  typeId: string;
  domainId: string;
  tagIds: string[];
  newTags?: string[];
  organizationId?: string;
};

// ---------- Helper: Generate Thumbnail ----------
function makeThumb(title: string, seed = 0): string {
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "DOC";

  const palettes = [
    ["#E0E7FF", "#C7D2FE", "#4F46E5"],
    ["#DCFCE7", "#BBF7D0", "#16A34A"],
    ["#FFE4E6", "#FECDD3", "#E11D48"],
    ["#FFF7ED", "#FFEDD5", "#EA580C"],
    ["#E0F2FE", "#BAE6FD", "#0284C7"],
    ["#F5F3FF", "#DDD6FE", "#7C3AED"],
  ];
  const [c1, c2, cText] = palettes[Math.abs(seed) % palettes.length];

  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'>
    <defs>
      <linearGradient id='g${seed}' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='${c1}'/>
        <stop offset='100%' stop-color='${c2}'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' rx='12' fill='url(#g${seed})'/>
    <g font-family='ui-sans-serif, -apple-system, Segoe UI, Roboto' text-anchor='middle'>
      <text x='200' y='270' font-size='96' font-weight='700' fill='${cText}' opacity='0.9'>${initials}</text>
    </g>
  </svg>`.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ---------- Helper: Create Document ----------
function createDoc(
  id: string,
  name: string,
  description: string,
  uploadDate: Date,
  type: string,
  domain: string,
  fileSize: number,
  source: "UPLOADED" | "PURCHASED",
  visibility: "PUBLIC" | "PRIVATE" | "INTERNAL" = "PUBLIC",
  tagIds: string[] = [],
  organizationId?: string
): LibraryDocument {
  const seed = Number(id.replace(/\D/g, "")) || 0;
  return {
    id,
    documentName: name,
    description,
    uploadDate: uploadDate.toISOString(),
    type,
    domain,
    fileSize,
    source,
    pages: 10 + (seed % 50),
    reads: seed * 10,
    visibility,
    interest: undefined,
    status: "SUCCESS",
    thumbnailUrl: makeThumb(name, seed),
    tagIds,
    organizationId,
  };
}

// ---------- Seed Data ----------
const seedLibraryDocuments: LibraryDocument[] = [
  createDoc(
    "lib-1",
    "Project Folder Description",
    "No description",
    new Date("2025-09-11"),
    "Research Paper",
    "Computer Science",
    2048576, // 2MB
    "UPLOADED",
    "PUBLIC",
    ["tag-1", "tag-3"]
  ),
  createDoc(
    "lib-2",
    "Software Requirements Specification",
    "Detailed SRS document",
    new Date("2025-10-15"),
    "Technical Report",
    "Software Engineering",
    3145728, // 3MB
    "UPLOADED",
    "PUBLIC",
    ["tag-2"]
  ),
  createDoc(
    "lib-3",
    "Machine Learning Fundamentals",
    "Introduction to ML concepts",
    new Date("2025-11-20"),
    "Tutorial",
    "Artificial Intelligence",
    5242880, // 5MB
    "PURCHASED",
    "PUBLIC",
    ["tag-1", "tag-4"]
  ),
  createDoc(
    "lib-4",
    "Database Design Patterns",
    "Common patterns in DB design",
    new Date("2025-08-05"),
    "Reference Guide",
    "Database Systems",
    1572864, // 1.5MB
    "UPLOADED",
    "INTERNAL",
    ["tag-2", "tag-5"],
    "org-1"
  ),
  createDoc(
    "lib-5",
    "React Best Practices 2025",
    "Modern React development guide",
    new Date("2025-12-01"),
    "Tutorial",
    "Web Development",
    4194304, // 4MB
    "PURCHASED",
    "PUBLIC",
    ["tag-3", "tag-4"]
  ),
  createDoc(
    "lib-6",
    "Data Structures and Algorithms",
    "Complete DSA handbook",
    new Date("2025-07-22"),
    "Textbook",
    "Computer Science",
    8388608, // 8MB
    "UPLOADED",
    "PUBLIC",
    ["tag-1"]
  ),
  createDoc(
    "lib-7",
    "Cloud Architecture Guide",
    "AWS and Azure best practices",
    new Date("2025-09-30"),
    "Technical Report",
    "Cloud Computing",
    6291456, // 6MB
    "PURCHASED",
    "PUBLIC",
    ["tag-5"]
  ),
  createDoc(
    "lib-8",
    "Python for Data Science",
    "Comprehensive Python guide",
    new Date("2025-11-05"),
    "Tutorial",
    "Data Science",
    7340032, // 7MB
    "UPLOADED",
    "PRIVATE",
    ["tag-2", "tag-4"]
  ),
];

// Mutable copy for CRUD operations
export const mockLibraryDocuments: LibraryDocument[] = [...seedLibraryDocuments];

// ---------- Normalization Helper ----------
function normalizeParams(params: LibraryQueryParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 12);
  const search = (params.search ?? "").trim().toLowerCase();
  return { page, limit, search, ...params };
}

// ---------- Filter Helper ----------
function applyFilters(
  docs: LibraryDocument[],
  params: ReturnType<typeof normalizeParams>
): LibraryDocument[] {
  let filtered = [...docs];

  // Search by name or description
  if (params.search) {
    filtered = filtered.filter(
      (doc) =>
        doc.documentName.toLowerCase().includes(params.search) ||
        doc.description?.toLowerCase().includes(params.search)
    );
  }

  // Filter by source
  if (params.source) {
    filtered = filtered.filter((doc) => doc.source === params.source);
  }

  // Filter by type
  if (params.type) {
    filtered = filtered.filter((doc) => doc.type === params.type);
  }

  // Filter by domain
  if (params.domain) {
    filtered = filtered.filter((doc) => doc.domain === params.domain);
  }

  // Filter by date range
  if (params.dateFrom) {
    const dateFrom = new Date(params.dateFrom);
    filtered = filtered.filter((doc) => {
      const docDate = new Date(doc.uploadDate);
      return docDate >= dateFrom;
    });
  }

  if (params.dateTo) {
    const dateTo = new Date(params.dateTo);
    dateTo.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter((doc) => {
      const docDate = new Date(doc.uploadDate);
      return docDate <= dateTo;
    });
  }

  return filtered;
}

// ---------- Public API: Get Library ----------
export function getLibrary(params: LibraryQueryParams = {}): LibraryResponse {
  const normalized = normalizeParams(params);
  let filtered = applyFilters(mockLibraryDocuments, normalized);

  const total = filtered.length;

  // Pagination
  const startIndex = (normalized.page - 1) * normalized.limit;
  const endIndex = startIndex + normalized.limit;
  const paginated = filtered.slice(startIndex, endIndex);

  return {
    documents: paginated,
    total,
  };
}

// ---------- Public API: Update Document ----------
export function updateDocument(
  documentId: string,
  data: UpdateDocumentRequest,
  documentTypes: Array<{ id: string; name: string }>,
  domains: Array<{ id: string; name: string }>,
  tags: Array<{ id: string; name: string }>,
  organizations: Array<{ id: string; name: string }>
): { message: string } {
  const docIndex = mockLibraryDocuments.findIndex((doc) => doc.id === documentId);
  if (docIndex === -1) {
    throw new Error("Document not found");
  }

  // Only allow updating UPLOADED documents
  if (mockLibraryDocuments[docIndex].source !== "UPLOADED") {
    throw new Error("Cannot update purchased documents");
  }

  const doc = mockLibraryDocuments[docIndex];

  // Find type and domain by ID
  const type = documentTypes.find((t) => t.id === data.typeId);
  const domain = domains.find((d) => d.id === data.domainId);

  if (!type || !domain) {
    throw new Error("Invalid type or domain");
  }

  // Validate tag IDs
  if (data.tagIds && data.tagIds.length > 0) {
    const invalidTags = data.tagIds.filter(
      (tagId) => !tags.some((tag) => tag.id === tagId)
    );
    if (invalidTags.length > 0) {
      throw new Error(`Invalid tag IDs: ${invalidTags.join(", ")}`);
    }
  }

  // Create new tags if provided
  const newTagIds: string[] = [];
  if (data.newTags && data.newTags.length > 0) {
    let nextTagId = tags.length + 1;
    for (const newTagName of data.newTags) {
      // Check if tag already exists
      const existingTag = tags.find(
        (tag) => tag.name.toLowerCase() === newTagName.toLowerCase()
      );
      if (existingTag) {
        newTagIds.push(existingTag.id);
      } else {
        // Create new tag
        const newTag = {
          id: `tag-${nextTagId}`,
          name: newTagName.trim(),
        };
        tags.push(newTag);
        newTagIds.push(newTag.id);
        nextTagId++;
      }
    }
  }

  // Update document
  doc.documentName = data.title;
  doc.description = data.description;
  doc.visibility = data.visibility;
  doc.type = type.name;
  doc.domain = domain.name;

  // Update tags - combine existing tagIds with new tag IDs
  const allTagIds = [...(data.tagIds || []), ...newTagIds];
  doc.tagIds = Array.from(new Set(allTagIds));

  // Update organizationId for INTERNAL visibility
  if (data.visibility === "INTERNAL") {
    if (!data.organizationId) {
      throw new Error("Organization ID is required when visibility is INTERNAL");
    }
    // Validate organization exists
    const orgExists = organizations.some((org) => org.id === data.organizationId);
    if (!orgExists) {
      throw new Error("Invalid organization ID");
    }
    doc.organizationId = data.organizationId;
  } else if (data.visibility === "PUBLIC") {
    // Clear organizationId for PUBLIC visibility
    doc.organizationId = undefined;
  }

  return {
    message: "Document updated successfully",
  };
}

// ---------- Public API: Delete Document ----------
export function deleteDocument(documentId: string): { message: string } {
  const docIndex = mockLibraryDocuments.findIndex((doc) => doc.id === documentId);
  if (docIndex === -1) {
    throw new Error("Document not found");
  }

  // Only allow deleting UPLOADED documents
  if (mockLibraryDocuments[docIndex].source !== "UPLOADED") {
    throw new Error("Cannot delete purchased documents");
  }

  // Remove document
  mockLibraryDocuments.splice(docIndex, 1);

  return {
    message: "Document deleted successfully",
  };
}

// ---------- Export for Async Pattern (Optional) ----------
export async function mockFetchLibrary(
  params: LibraryQueryParams = {}
): Promise<LibraryResponse> {
  // Simulate light latency
  await new Promise((res) => setTimeout(res, 100));
  return getLibrary(params);
}

