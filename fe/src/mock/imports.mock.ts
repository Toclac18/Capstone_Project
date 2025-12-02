// src/mocks/imports.mock.ts
import type {
  MemberImportBatch,
  OrgEnrollment,
} from "@/services/org-admin-imports.service";

const mockBatchList: MemberImportBatch[] = [
  {
    id: "mock-batch-001",
    importSource: "EXCEL",
    totalEmails: 3,
    successCount: 1,
    failedCount: 0,
    skippedCount: 2,
    fileName: "import_example.xlsx",
    fileUrl: null,
    notes: null,
    adminName: "Mock Admin",
    adminEmail: "mock.admin@example.com",
    importedAt: new Date().toISOString(),
  },
  {
    id: "mock-batch-002",
    importSource: "MANUAL",
    totalEmails: 2,
    successCount: 2,
    failedCount: 0,
    skippedCount: 0,
    fileName: null,
    fileUrl: null,
    notes: null,
    adminName: "Mock Admin",
    adminEmail: "mock.admin@example.com",
    importedAt: new Date().toISOString(),
  },
];

const mockEnrollments: Record<string, OrgEnrollment[]> = {
  "mock-batch-001": [
    {
      enrollmentId: "e1",
      memberId: "m1",
      memberEmail: "john@example.com",
      memberFullName: "John Doe",
      memberAvatarUrl: null,
      organizationId: "mock-org",
      organizationName: "Mock Organization",
      status: "APPROVED",
      invitedAt: new Date().toISOString(),
      respondedAt: null,
    },
    {
      enrollmentId: "e2",
      memberId: "m2",
      memberEmail: "anna@example.com",
      memberFullName: "Anna Lee",
      memberAvatarUrl: null,
      organizationId: "mock-org",
      organizationName: "Mock Organization",
      status: "APPROVED",
      invitedAt: new Date().toISOString(),
      respondedAt: null,
    },
  ],
  "mock-batch-002": [],
};

function makePageInfo(
  page: number,
  size: number,
  totalElements: number,
): {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
} {
  const totalPages = Math.max(Math.ceil(totalElements / size), 1);
  const first = page === 0;
  const last = page >= totalPages - 1;
  return {
    page,
    size,
    totalElements,
    totalPages,
    first,
    last,
    hasNext: !last,
    hasPrevious: !first,
  };
}

/** MOCK list: GIỐNG HỆT BE: { success, data, pageInfo, timestamp } */
export async function mockFetchImports(params: {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = (params.page ?? 1) - 1; // FE 1-based -> mock 0-based
  const size = params.pageSize ?? 10;

  let filtered = mockBatchList;

  const kw = (params.q ?? "").trim().toLowerCase();
  if (kw) {
    filtered = filtered.filter(
      (b) =>
        b.fileName?.toLowerCase().includes(kw) ||
        b.adminEmail.toLowerCase().includes(kw),
    );
  }

  const totalElements = filtered.length;
  const start = page * size;
  const data = filtered.slice(start, start + size);

  return {
    success: true,
    data,
    pageInfo: makePageInfo(page, size, totalElements),
    timestamp: new Date().toISOString(),
  };
}

/** MOCK detail enrollments: { success, data, pageInfo, timestamp } */
export async function mockFetchImportDetail(params: {
  id: string;
  page?: number;
  pageSize?: number;
}) {
  const page = (params.page ?? 1) - 1;
  const size = params.pageSize ?? 10;

  const all = mockEnrollments[params.id] ?? [];
  const totalElements = all.length;
  const start = page * size;
  const data = all.slice(start, start + size);

  return {
    success: true,
    data,
    pageInfo: makePageInfo(page, size, totalElements),
    timestamp: new Date().toISOString(),
  };
}

/** MOCK create import: trả về wrapper giống BE nếu cần */
export async function mockCreateImport(file: File, createdBy: string) {
  const batch: MemberImportBatch = {
    id: `mock-${Date.now()}`,
    importSource: "EXCEL",
    totalEmails: 0,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    fileName: file.name,
    fileUrl: null,
    notes: null,
    adminName: createdBy,
    adminEmail: createdBy,
    importedAt: new Date().toISOString(),
  };

  mockBatchList.unshift(batch);
  mockEnrollments[batch.id] = [];

  return {
    success: true,
    data: batch,
    timestamp: new Date().toISOString(),
  };
}
