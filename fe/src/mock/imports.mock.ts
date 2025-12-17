// src/mocks/imports.mock.ts
import type {
  MemberImportBatch,
  OrgEnrollment,
} from "@/services/org-admin-imports.service";

/**
 * DIVERSE MOCK DATA
 * Covers multiple scenarios:
 * - Different import sources (EXCEL, MANUAL)
 * - Various statuses (success, failed, skipped, pending)
 * - Multiple organizations
 * - Different batch sizes
 * - Success/failure patterns
 */

const mockBatchList: MemberImportBatch[] = [
  // Batch 1: Completed - High success rate (95%)
  {
    id: "batch-2024-12-16-001",
    importSource: "EXCEL",
    totalEmails: 100,
    successCount: 95,
    failedCount: 3,
    skippedCount: 2,
    fileName: "Q4_2024_members_batch1.xlsx",
    fileUrl: null,
    notes: "Q4 2024 new member registrations",
    adminName: "Sarah Johnson",
    adminEmail: "sarah.johnson@techcorp.com",
    importedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },

  // Batch 2: Completed - Mixed results
  {
    id: "batch-2024-12-15-002",
    importSource: "EXCEL",
    totalEmails: 50,
    successCount: 42,
    failedCount: 5,
    skippedCount: 3,
    fileName: "December_wave2_users.xlsx",
    fileUrl: null,
    notes: "December wave 2 - Data quality issues",
    adminName: "Mike Chen",
    adminEmail: "mike.chen@techcorp.com",
    importedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },

  // Batch 3: Completed - Perfect score
  {
    id: "batch-2024-12-14-003",
    importSource: "EXCEL",
    totalEmails: 25,
    successCount: 25,
    failedCount: 0,
    skippedCount: 0,
    fileName: "HR_verified_list.xlsx",
    fileUrl: null,
    notes: "HR verified and cleaned data",
    adminName: "Lisa Park",
    adminEmail: "lisa.park@techcorp.com",
    importedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },

  // Batch 4: High failure rate
  {
    id: "batch-2024-12-13-004",
    importSource: "EXCEL",
    totalEmails: 75,
    successCount: 45,
    failedCount: 20,
    skippedCount: 10,
    fileName: "customer_list_raw.xlsx",
    fileUrl: null,
    notes: "Raw customer export - requires cleaning",
    adminName: "David Roberts",
    adminEmail: "david.roberts@techcorp.com",
    importedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
  },

  // Batch 5: Manual entry
  {
    id: "batch-2024-12-12-005",
    importSource: "MANUAL",
    totalEmails: 8,
    successCount: 8,
    failedCount: 0,
    skippedCount: 0,
    fileName: null,
    fileUrl: null,
    notes: "Executive team manually added",
    adminName: "Emma Wilson",
    adminEmail: "emma.wilson@techcorp.com",
    importedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },

  // Batch 6: Medium size with moderate success
  {
    id: "batch-2024-12-11-006",
    importSource: "EXCEL",
    totalEmails: 150,
    successCount: 120,
    failedCount: 15,
    skippedCount: 15,
    fileName: "university_enrollment_batch.xlsx",
    fileUrl: null,
    notes: "University partnership registration",
    adminName: "James Park",
    adminEmail: "james.park@techcorp.com",
    importedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
  },

  // Batch 7: Small batch, high failure
  {
    id: "batch-2024-12-10-007",
    importSource: "EXCEL",
    totalEmails: 20,
    successCount: 12,
    failedCount: 8,
    skippedCount: 0,
    fileName: "partner_list_draft.xlsx",
    fileUrl: null,
    notes: "Draft partner list - validation needed",
    adminName: "Rachel Green",
    adminEmail: "rachel.green@techcorp.com",
    importedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },

  // Additional batches for pagination testing (batches 8-28)
  ...Array.from({ length: 21 }, (_, i) => {
    const batchNum = i + 8;
    const daysAgo = 7 + i;
    const successRate = [
      85, 92, 78, 88, 95, 70, 82, 90, 75, 87, 93, 68, 84, 89, 91, 72, 86, 79,
      94, 81, 77,
    ][i];
    const total = [
      40, 60, 35, 80, 45, 90, 55, 100, 30, 75, 120, 25, 65, 85, 140, 50, 110,
      70, 95, 35, 40,
    ][i];
    const success = Math.round((total * successRate) / 100);
    const failed = Math.round(total * ((100 - successRate) / 100) * 0.7);
    const skipped = total - success - failed;

    return {
      id: `batch-2024-${String(12 - Math.floor(daysAgo / 30)).padStart(2, "0")}-${String(16 - (daysAgo % 28) || 16).padStart(2, "0")}-${String(batchNum).padStart(3, "0")}`,
      importSource: batchNum % 3 === 0 ? "MANUAL" : "EXCEL",
      totalEmails: total,
      successCount: success,
      failedCount: failed,
      skippedCount: skipped,
      fileName: batchNum % 3 === 0 ? null : `batch_${batchNum}_data.xlsx`,
      fileUrl: null,
      notes: [
        "Monthly team enrollment",
        "Quarterly review batch",
        "Partner integration wave",
        "Customer onboarding",
        "Department registration",
        "Training program members",
        "Conference attendees",
        "Workshop participants",
        "Certification holders",
        "Premium tier users",
        "Trial account conversion",
        "Enterprise deployment",
        "Community members",
        "Vendor registration",
        "Contractor onboarding",
        "Affiliate program",
        "Beta testers group",
        "Focus group members",
        "Advisory board",
        "Research participants",
        "Alumni network",
      ][i],
      adminName: [
        "Sarah Johnson",
        "Mike Chen",
        "Lisa Park",
        "David Roberts",
        "Emma Wilson",
        "James Park",
        "Rachel Green",
        "John Smith",
        "Maria Garcia",
        "Thomas Brown",
        "Jennifer Lee",
        "Robert Davis",
        "Patricia Martinez",
        "Christopher Anderson",
        "Linda Taylor",
        "Michael Wilson",
        "Barbara Thomas",
        "James Jackson",
        "Mary White",
        "Charles Harris",
        "Susan Martin",
      ][i],
      adminEmail:
        [
          "sarah.johnson",
          "mike.chen",
          "lisa.park",
          "david.roberts",
          "emma.wilson",
          "james.park",
          "rachel.green",
          "john.smith",
          "maria.garcia",
          "thomas.brown",
          "jennifer.lee",
          "robert.davis",
          "patricia.martinez",
          "christopher.anderson",
          "linda.taylor",
          "michael.wilson",
          "barbara.thomas",
          "james.jackson",
          "mary.white",
          "charles.harris",
          "susan.martin",
        ][i] + "@techcorp.com",
      importedAt: new Date(
        Date.now() - daysAgo * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
  }),
];

/**
 * Detailed enrollment records by batch
 * Each batch contains diverse member profiles with different statuses
 */
const mockEnrollments: Record<string, OrgEnrollment[]> = {
  "batch-2024-12-16-001": [
    // Tech Corp members
    {
      enrollmentId: "e-001-1",
      memberId: "m-001",
      memberEmail: "alice.johnson@gmail.com",
      memberFullName: "Alice Johnson",
      memberAvatarUrl: null,
      organizationId: "org-techcorp",
      organizationName: "Tech Corporation",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      enrollmentId: "e-001-2",
      memberId: "m-002",
      memberEmail: "bob.smith@gmail.com",
      memberFullName: "Bob Smith",
      memberAvatarUrl: null,
      organizationId: "org-techcorp",
      organizationName: "Tech Corporation",
      status: "PENDING",
      invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: null,
    },
    {
      enrollmentId: "e-001-3",
      memberId: "m-003",
      memberEmail: "carol.davis@gmail.com",
      memberFullName: "Carol Davis",
      memberAvatarUrl: null,
      organizationId: "org-techcorp",
      organizationName: "Tech Corporation",
      status: "REJECTED",
      invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      enrollmentId: "e-001-4",
      memberId: "m-004",
      memberEmail: "diana.wilson@gmail.com",
      memberFullName: "Diana Wilson",
      memberAvatarUrl: null,
      organizationId: "org-techcorp",
      organizationName: "Tech Corporation",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(
        Date.now() - 1.5 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    {
      enrollmentId: "e-001-5",
      memberId: "m-005",
      memberEmail: "evan.brown@gmail.com",
      memberFullName: "Evan Brown",
      memberAvatarUrl: null,
      organizationId: "org-techcorp",
      organizationName: "Tech Corporation",
      status: "CANCELLED",
      invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: null,
    },
  ],

  "batch-2024-12-15-002": [
    // Finance Partners
    {
      enrollmentId: "e-002-1",
      memberId: "m-006",
      memberEmail: "frank.miller@finance.com",
      memberFullName: "Frank Miller",
      memberAvatarUrl: null,
      organizationId: "org-finance",
      organizationName: "Finance Partners Inc",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      enrollmentId: "e-002-2",
      memberId: "m-007",
      memberEmail: "grace.lee@finance.com",
      memberFullName: "Grace Lee",
      memberAvatarUrl: null,
      organizationId: "org-finance",
      organizationName: "Finance Partners Inc",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      enrollmentId: "e-002-3",
      memberId: "m-008",
      memberEmail: "henry.clark@finance.com",
      memberFullName: "Henry Clark",
      memberAvatarUrl: null,
      organizationId: "org-finance",
      organizationName: "Finance Partners Inc",
      status: "PENDING",
      invitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: null,
    },
  ],

  "batch-2024-12-14-003": [
    // HR Verified list - all approved
    {
      enrollmentId: "e-003-1",
      memberId: "m-009",
      memberEmail: "iris.martinez@company.com",
      memberFullName: "Iris Martinez",
      memberAvatarUrl: null,
      organizationId: "org-company",
      organizationName: "Company X",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      enrollmentId: "e-003-2",
      memberId: "m-010",
      memberEmail: "jack.anderson@company.com",
      memberFullName: "Jack Anderson",
      memberAvatarUrl: null,
      organizationId: "org-company",
      organizationName: "Company X",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  "batch-2024-12-13-004": [
    // Raw customer data - mixed results
    {
      enrollmentId: "e-004-1",
      memberId: "m-011",
      memberEmail: "kim.taylor@email.com",
      memberFullName: "Kim Taylor",
      memberAvatarUrl: null,
      organizationId: "org-customer",
      organizationName: "Customer Base A",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      enrollmentId: "e-004-2",
      memberId: null,
      memberEmail: "invalid.email@invalid",
      memberFullName: "Invalid Entry",
      memberAvatarUrl: null,
      organizationId: "org-customer",
      organizationName: "Customer Base A",
      status: "REJECTED",
      invitedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: null,
    },
    {
      enrollmentId: "e-004-3",
      memberId: "m-012",
      memberEmail: "leo.harris@email.com",
      memberFullName: "Leo Harris",
      memberAvatarUrl: null,
      organizationId: "org-customer",
      organizationName: "Customer Base A",
      status: "PENDING",
      invitedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: null,
    },
  ],

  "batch-2024-12-12-005": [
    // Executive team - manual entry, all approved
    {
      enrollmentId: "e-005-1",
      memberId: "m-013",
      memberEmail: "ceo@executive.com",
      memberFullName: "Michael Chen",
      memberAvatarUrl: null,
      organizationId: "org-executive",
      organizationName: "Executive Board",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      enrollmentId: "e-005-2",
      memberId: "m-014",
      memberEmail: "cfo@executive.com",
      memberFullName: "Patricia Chen",
      memberAvatarUrl: null,
      organizationId: "org-executive",
      organizationName: "Executive Board",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],

  "batch-2024-12-11-006": [
    // University enrollment
    {
      enrollmentId: "e-006-1",
      memberId: "m-015",
      memberEmail: "student1@university.edu",
      memberFullName: "Alex Smith",
      memberAvatarUrl: null,
      organizationId: "org-university",
      organizationName: "Tech University",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      enrollmentId: "e-006-2",
      memberId: "m-016",
      memberEmail: "student2@university.edu",
      memberFullName: "Bailey Johnson",
      memberAvatarUrl: null,
      organizationId: "org-university",
      organizationName: "Tech University",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      enrollmentId: "e-006-3",
      memberId: "m-017",
      memberEmail: "student3@university.edu",
      memberFullName: "Casey Davis",
      memberAvatarUrl: null,
      organizationId: "org-university",
      organizationName: "Tech University",
      status: "PENDING",
      invitedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: null,
    },
  ],

  "batch-2024-12-10-007": [
    // Partner draft - needs validation
    {
      enrollmentId: "e-007-1",
      memberId: "m-018",
      memberEmail: "partner1@company.com",
      memberFullName: "Partner One",
      memberAvatarUrl: null,
      organizationId: "org-partner",
      organizationName: "Partner Network",
      status: "APPROVED",
      invitedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      enrollmentId: "e-007-2",
      memberId: null,
      memberEmail: "invalid@partner",
      memberFullName: "Incomplete",
      memberAvatarUrl: null,
      organizationId: "org-partner",
      organizationName: "Partner Network",
      status: "REJECTED",
      invitedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      respondedAt: null,
    },
  ],
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
