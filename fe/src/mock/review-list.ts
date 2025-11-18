// src/mock/review-list.ts
// Mock data for Reviewer Review List

import type {
  ReviewDocument,
  ReviewRequest,
  ReviewHistory,
  ReviewListResponse,
  ReviewRequestsResponse,
  ReviewHistoryResponse,
  ReviewHistoryQueryParams,
  ReviewAction,
} from "@/types/review";


// ---------- Seed Data ----------
const seedReviewDocuments: ReviewDocument[] = [
  {
    id: "doc-review-1",
    documentTitle: "Introduction to Machine Learning",
    description: "Comprehensive guide to ML fundamentals",
    uploaderName: "John Doe",
    uploaderId: "reader-1",
    uploadedDate: "2025-01-15T10:30:00Z",
    documentType: "Research Paper",
    domain: "Computer Science",
    domains: ["Computer Science"],
    tags: ["Machine Learning", "AI", "Data Science"],
    tagIds: ["tag-1", "tag-2", "tag-3"],
    status: "PENDING",
    reviewRequestDate: "2025-01-15T10:35:00Z",
    specializationId: "spec-1",
    specialization: "Machine Learning",
  },
  {
    id: "doc-review-2",
    documentTitle: "Advanced Algorithms in Python",
    description: "Deep dive into algorithm optimization",
    uploaderName: "Jane Smith",
    uploaderId: "reader-2",
    uploadedDate: "2025-01-16T14:20:00Z",
    documentType: "Tutorial",
    domain: "Computer Science",
    domains: ["Computer Science"],
    tags: ["Algorithms", "Python", "Programming"],
    tagIds: ["tag-6", "tag-7"],
    status: "PENDING",
    reviewRequestDate: "2025-01-16T14:25:00Z",
    specializationId: "spec-4",
    specialization: "Software Engineering",
  },
  {
    id: "doc-review-4",
    documentTitle: "Database Design Patterns",
    description: "Common patterns in database architecture",
    uploaderName: "Sarah Williams",
    uploaderId: "reader-4",
    uploadedDate: "2025-01-18T16:45:00Z",
    documentType: "Technical Report",
    domain: "Computer Science",
    domains: ["Computer Science"],
    tags: ["Database", "Design Patterns", "Architecture"],
    tagIds: ["tag-7"],
    status: "PENDING",
    reviewRequestDate: "2025-01-18T16:50:00Z",
    specializationId: "spec-4",
    specialization: "Software Engineering",
  },
  {
    id: "doc-review-5",
    documentTitle: "Quantum Computing Fundamentals",
    description: "Introduction to quantum computing principles",
    uploaderName: "David Brown",
    uploaderId: "reader-5",
    uploadedDate: "2025-01-19T13:30:00Z",
    documentType: "Research Paper",
    domain: "Physics",
    domains: ["Physics"],
    tags: ["Quantum Computing", "Physics"],
    tagIds: ["tag-8"],
    status: "PENDING",
    reviewRequestDate: "2025-01-19T13:35:00Z",
  },
];

const seedReviewHistory: ReviewHistory[] = [
  {
    id: "review-hist-1",
    documentId: "doc-hist-1",
    documentTitle: "Introduction to React Hooks",
    documentType: "Tutorial",
    domain: "Computer Science",
    specializationId: "spec-3",
    specialization: "Web Development",
    tags: ["React", "Hooks", "Frontend"],
    uploaderName: "John Doe",
    uploadedDate: "2025-01-09T08:00:00Z",
    reviewDate: "2025-01-10T10:00:00Z",
    action: "APPROVE",
    verificationTime: "2025-01-10T10:15:00Z",
    reviewerId: "reviewer-1",
    reviewerName: "Current Reviewer",
    comments: "Well-structured and comprehensive guide.",
  },
  {
    id: "review-hist-2",
    documentId: "doc-hist-2",
    documentTitle: "Node.js Performance Optimization",
    documentType: "Technical Report",
    domain: "Computer Science",
    specializationId: "spec-4",
    specialization: "Software Engineering",
    tags: ["Node.js", "Performance", "Backend"],
    uploaderName: "Jane Smith",
    uploadedDate: "2025-01-10T12:00:00Z",
    reviewDate: "2025-01-11T14:30:00Z",
    action: "REJECT",
    verificationTime: "2025-01-11T14:45:00Z",
    reviewerId: "reviewer-1",
    reviewerName: "Current Reviewer",
    comments: "Missing critical sections on error handling.",
  },
  {
    id: "review-hist-3",
    documentId: "doc-hist-3",
    documentTitle: "TypeScript Advanced Patterns",
    documentType: "Article",
    domain: "Computer Science",
    specializationId: "spec-4",
    specialization: "Software Engineering",
    tags: ["TypeScript", "Programming", "Best Practices"],
    uploaderName: "Mike Johnson",
    uploadedDate: "2025-01-11T09:00:00Z",
    reviewDate: "2025-01-12T09:20:00Z",
    action: "APPROVE",
    verificationTime: "2025-01-12T09:35:00Z",
    reviewerId: "reviewer-1",
    reviewerName: "Current Reviewer",
    comments: "Excellent explanation of advanced concepts.",
  },
  {
    id: "review-hist-4",
    documentId: "doc-hist-4",
    documentTitle: "Docker Containerization Guide",
    documentType: "Tutorial",
    domain: "Computer Science",
    specializationId: "spec-4",
    specialization: "Software Engineering",
    tags: ["Docker", "DevOps", "Containers"],
    uploaderName: "Sarah Williams",
    uploadedDate: "2025-01-12T14:00:00Z",
    reviewDate: "2025-01-13T16:00:00Z",
    action: "APPROVE",
    verificationTime: "2025-01-13T16:10:00Z",
    reviewerId: "reviewer-1",
    reviewerName: "Current Reviewer",
  },
  {
    id: "review-hist-5",
    documentId: "doc-hist-5",
    documentTitle: "RESTful API Design Principles",
    documentType: "Research Paper",
    domain: "Computer Science",
    specializationId: "spec-4",
    specialization: "Software Engineering",
    tags: ["API", "REST", "Design"],
    uploaderName: "David Brown",
    uploadedDate: "2025-01-13T10:00:00Z",
    reviewDate: "2025-01-14T11:45:00Z",
    action: "REJECT",
    verificationTime: "2025-01-14T12:00:00Z",
    reviewerId: "reviewer-1",
    reviewerName: "Current Reviewer",
    comments: "Insufficient examples and use cases.",
  },
];

// Seed data for Review Requests (documents waiting for reviewer to accept invitation)
const seedReviewRequests: ReviewRequest[] = [
  {
    id: "req-1",
    documentTitle: "Deep Learning Applications",
    description: "Practical applications of deep learning",
    uploaderName: "Alice Cooper",
    uploaderId: "reader-6",
    uploadedDate: "2025-01-20T09:00:00Z",
    documentType: "Research Paper",
    domain: "Computer Science",
    domains: ["Computer Science"],
    tags: ["Deep Learning", "AI", "Neural Networks"],
    tagIds: ["tag-1", "tag-2"],
    inviteDate: "2025-01-20T09:05:00Z",
    specializationId: "spec-1",
    specialization: "Machine Learning",
  },
  {
    id: "req-2",
    documentTitle: "System Design Patterns",
    description: "Enterprise system design best practices",
    uploaderName: "Bob Wilson",
    uploaderId: "reader-7",
    uploadedDate: "2025-01-21T11:30:00Z",
    documentType: "Technical Report",
    domain: "Computer Science",
    domains: ["Computer Science"],
    tags: ["System Design", "Architecture"],
    tagIds: ["tag-7"],
    inviteDate: "2025-01-21T11:35:00Z",
    specializationId: "spec-4",
    specialization: "Software Engineering",
  },
  {
    id: "req-3",
    documentTitle: "Cloud Security Best Practices",
    description: "Security guidelines for cloud deployments",
    uploaderName: "Carol Martinez",
    uploaderId: "reader-8",
    uploadedDate: "2025-01-22T14:15:00Z",
    documentType: "Article",
    domain: "Computer Science",
    domains: ["Computer Science"],
    tags: ["Security", "Cloud Computing"],
    tagIds: ["tag-5"],
    inviteDate: "2025-01-22T14:20:00Z",
    specializationId: "spec-5",
    specialization: "Cybersecurity",
  },
];

// Mutable copies for CRUD operations
export let mockReviewDocuments: ReviewDocument[] = [...seedReviewDocuments];
export let mockReviewRequests: ReviewRequest[] = [...seedReviewRequests];
export let mockReviewHistory: ReviewHistory[] = [...seedReviewHistory];

// ---------- Helper Functions ----------
function normalizeParams(params: {
  page?: number;
  limit?: number;
  status?: "PENDING";
  search?: string;
} = {}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 12);
  const search = (params.search ?? "").trim().toLowerCase();
  return { page, limit, search, status: params.status };
}

function applyFilters(
  docs: ReviewDocument[],
  params: ReturnType<typeof normalizeParams>
): ReviewDocument[] {
  let filtered = [...docs];

  // Filter by status
  if (params.status) {
    filtered = filtered.filter((doc) => doc.status === params.status);
  }

  // Search by title, description, or uploader
  if (params.search) {
    filtered = filtered.filter(
      (doc) =>
        doc.documentTitle.toLowerCase().includes(params.search) ||
        doc.description?.toLowerCase().includes(params.search) ||
        doc.uploaderName.toLowerCase().includes(params.search)
    );
  }

  return filtered;
}

// ---------- Public API ----------
export function getReviewDocuments(
  params?: {
    page?: number;
    limit?: number;
    status?: "PENDING";
    search?: string;
  }
): ReviewListResponse {
  const normalized = normalizeParams(params);
  const filtered = applyFilters(mockReviewDocuments, normalized);

  // Pagination
  const start = (normalized.page - 1) * normalized.limit;
  const end = start + normalized.limit;
  const paginated = filtered.slice(start, end);
  const total = filtered.length;

  return {
    documents: paginated,
    total,
  };
}

export function getReviewRequests(
  params?: {
    page?: number;
    limit?: number;
    search?: string;
  }
): ReviewRequestsResponse {
  const normalized = normalizeParams(params);
  let filtered = [...mockReviewRequests];

  // Search by title, description, or uploader
  if (normalized.search) {
    filtered = filtered.filter(
      (req) =>
        req.documentTitle.toLowerCase().includes(normalized.search) ||
        req.description?.toLowerCase().includes(normalized.search) ||
        req.uploaderName.toLowerCase().includes(normalized.search)
    );
  }

  // Pagination
  const start = (normalized.page - 1) * normalized.limit;
  const end = start + normalized.limit;
  const paginated = filtered.slice(start, end);
  const total = filtered.length;

  return {
    requests: paginated,
    total,
  };
}

export function getReviewHistory(
  params?: ReviewHistoryQueryParams
): ReviewHistoryResponse {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.max(1, params?.limit ?? 12);
  const search = (params?.search ?? "").trim().toLowerCase();

  let filtered = [...mockReviewHistory];

  // Search by document title
  if (search) {
    filtered = filtered.filter((review) =>
      review.documentTitle.toLowerCase().includes(search)
    );
  }

  // Filter by date range
  if (params?.dateFrom) {
    const dateFrom = new Date(params.dateFrom);
    filtered = filtered.filter((review) => new Date(review.reviewDate) >= dateFrom);
  }
  if (params?.dateTo) {
    const dateTo = new Date(params.dateTo);
    dateTo.setHours(23, 59, 59, 999); // End of day
    filtered = filtered.filter((review) => new Date(review.reviewDate) <= dateTo);
  }

  // Filter by type
  if (params?.type) {
    filtered = filtered.filter((review) => review.documentType === params.type);
  }

  // Filter by domain
  if (params?.domain) {
    filtered = filtered.filter((review) => review.domain === params.domain);
  }

  // Filter by specialization
  if (params?.specialization) {
    filtered = filtered.filter((review) => review.specialization === params.specialization);
  }

  // Filter by action (Active = APPROVE, Rejected = REJECT)
  if (params?.active !== undefined || params?.rejected !== undefined) {
    filtered = filtered.filter((review) => {
      if (params.active && review.action === "APPROVE") return true;
      if (params.rejected && review.action === "REJECT") return true;
      if (!params.active && !params.rejected) return true;
      return false;
    });
  }

  // Sort by review date (newest first)
  filtered.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());

  // Pagination
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = filtered.slice(start, end);
  const total = filtered.length;

  return {
    reviews: paginated,
    total,
  };
}

// Reset mock data (for testing)
export function resetMockReviewData() {
  mockReviewDocuments = [...seedReviewDocuments];
  mockReviewRequests = [...seedReviewRequests];
  mockReviewHistory = [...seedReviewHistory];
}

// Submit review for a document (from Todo tab)
export function submitReview(
  documentId: string,
  action: ReviewAction
): { message: string } {
  const index = mockReviewDocuments.findIndex((doc) => doc.id === documentId);
  if (index === -1) {
    throw new Error(`Document with id ${documentId} not found`);
  }

  const doc = mockReviewDocuments[index];
  // Remove from todo list
  mockReviewDocuments.splice(index, 1);

  // Add to history
  const now = new Date().toISOString();
  const historyItem: ReviewHistory = {
    id: `review-${Date.now()}`,
    documentId: doc.id,
    documentTitle: doc.documentTitle,
    documentType: doc.documentType,
    domain: doc.domain,
    specializationId: doc.specializationId,
    specialization: doc.specialization,
    tags: doc.tags,
    uploaderName: doc.uploaderName,
    uploadedDate: doc.uploadedDate,
    reviewDate: now,
    action,
    verificationTime: now,
    reviewerId: "reviewer-1",
    reviewerName: "Current Reviewer",
    comments:
      action === "APPROVE"
        ? "Approved in mock environment."
        : "Rejected in mock environment.",
  };

  mockReviewHistory = [historyItem, ...mockReviewHistory];

  return { message: "Review submitted successfully" };
}

// Approve or reject a review request (from Review Requests tab)
export function approveReviewRequest(
  requestId: string,
  action: ReviewAction
): { message: string } {
  const index = mockReviewRequests.findIndex((req) => req.id === requestId);
  if (index === -1) {
    // Idempotent behavior: if already processed, just return success
    return { message: "Review request already processed or not found" };
  }

  const req = mockReviewRequests[index];
  // Remove from requests list
  mockReviewRequests.splice(index, 1);

  const now = new Date().toISOString();

  if (action === "APPROVE") {
    // Move to Todo list as a pending document
    const newDoc: ReviewDocument = {
      id: `doc-from-${req.id}`,
      documentTitle: req.documentTitle,
      description: req.description,
      uploaderName: req.uploaderName,
      uploaderId: req.uploaderId,
      uploadedDate: req.uploadedDate,
      documentType: req.documentType,
      domain: req.domain,
      domains: req.domains,
      tags: req.tags,
      tagIds: req.tagIds,
      status: "PENDING",
      reviewRequestDate: req.inviteDate,
      specializationId: req.specializationId,
      specialization: req.specialization,
    };

    mockReviewDocuments = [newDoc, ...mockReviewDocuments];
  } else if (action === "REJECT") {
    // Add directly to history as rejected
    const historyItem: ReviewHistory = {
      id: `review-req-${Date.now()}`,
      documentId: `doc-from-${req.id}`,
      documentTitle: req.documentTitle,
      documentType: req.documentType,
      domain: req.domain,
      specializationId: req.specializationId,
      specialization: req.specialization,
      tags: req.tags,
      uploaderName: req.uploaderName,
      uploadedDate: req.uploadedDate,
      reviewDate: now,
      action: "REJECT",
      verificationTime: now,
      reviewerId: "reviewer-1",
      reviewerName: "Current Reviewer",
      comments: "Request rejected in mock environment.",
    };

    mockReviewHistory = [historyItem, ...mockReviewHistory];
  }

  return { message: "Review request processed successfully" };
}


