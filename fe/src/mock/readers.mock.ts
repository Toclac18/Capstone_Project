// src/mock/readers.ts
// Compatible with route: src/app/api/org-admin/readers/route.ts

export type ReaderStatus = string;

export type Reader = {
  enrollmentId: string;
  memberId: string;
  memberEmail: string;
  memberFullName: string;
  memberAvatarUrl: string | null;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  status: ReaderStatus; // ví dụ: "PENDING_INVITE", "ACTIVE", ...
  invitedAt: string;
  respondedAt: string | null;
};

export type MockReadersQuery = {
  page?: number; // 1-based
  pageSize?: number; // e.g., 10, 20, 50
  q?: string;
  status?: ReaderStatus | "ALL";
};

export type MockReadersBackendResponse = {
  success: boolean;
  data: Reader[];
  pageInfo: {
    page: number; // 0-based
    size: number;
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp: string;
};

/* ---------- Seed (fixed small set for deterministic testing) ---------- */

const seed: Reader[] = [
  {
    enrollmentId: "0df3e29e-ad76-4d7a-b40a-593a2e4d59bf",
    memberId: "a68bffcc-3f20-30a9-af76-d40bed1b2eeb",
    memberEmail: "reader3@gmail.com",
    memberFullName: "Hoàng Văn Đức",
    memberAvatarUrl: null,
    organizationId: "fabc71eb-0e67-3ad5-be14-accc338bdbaa",
    organizationName: "Đại học Bách Khoa Hà Nội",
    organizationType: "University",
    status: "PENDING_INVITE",
    invitedAt: "2025-12-02T04:45:02.850971Z",
    respondedAt: "2025-12-02T04:45:02.850971Z",
  },
  {
    enrollmentId: "11111111-2222-3333-4444-555555555555",
    memberId: "member-1",
    memberEmail: "alice@example.com",
    memberFullName: "Alice Nguyen",
    memberAvatarUrl: null,
    organizationId: "org-1",
    organizationName: "Đại học Quốc gia Hà Nội",
    organizationType: "University",
    status: "ACTIVE",
    invitedAt: "2025-10-01T08:00:00.000Z",
    respondedAt: "2025-10-02T09:30:00.000Z",
  },
  {
    enrollmentId: "66666666-7777-8888-9999-000000000000",
    memberId: "member-2",
    memberEmail: "bob@example.com",
    memberFullName: "Bob Tran",
    memberAvatarUrl: null,
    organizationId: "org-2",
    organizationName: "Trường THPT Chuyên Amsterdam",
    organizationType: "HighSchool",
    status: "SUSPENDED",
    invitedAt: "2025-09-10T08:00:00.000Z",
    respondedAt: null,
  },
];

/* ---------- Generate thêm dữ liệu giả ---------- */

function generateExtra(count: number): Reader[] {
  const rows: Reader[] = [];
  const orgs = [
    {
      id: "org-hust",
      name: "Đại học Bách Khoa Hà Nội",
      type: "University",
    },
    {
      id: "org-vnu",
      name: "Đại học Quốc gia Hà Nội",
      type: "University",
    },
    {
      id: "org-edu01",
      name: "Trung tâm Đào tạo AI READEE",
      type: "TrainingCenter",
    },
  ];

  for (let i = 1; i <= count; i++) {
    const org = orgs[i % orgs.length];
    const status: ReaderStatus =
      i % 7 === 0 ? "SUSPENDED" : i % 5 === 0 ? "PENDING_INVITE" : "ACTIVE";

    const baseDate = new Date("2025-09-01T08:00:00.000Z");
    baseDate.setDate(baseDate.getDate() + i);

    const invitedAt = baseDate.toISOString();
    const respondedAt =
      status === "ACTIVE"
        ? new Date(baseDate.getTime() + 86400000).toISOString()
        : null;

    rows.push({
      enrollmentId: `mock-enrollment-${i}`,
      memberId: `mock-member-${i}`,
      memberEmail: `reader${i}@example.com`,
      memberFullName: `Reader ${i}`,
      memberAvatarUrl: null,
      organizationId: org.id,
      organizationName: org.name,
      organizationType: org.type,
      status,
      invitedAt,
      respondedAt,
    });
  }

  return rows;
}

export const mockReaders: Reader[] = [...seed, ...generateExtra(150)];

/* ---------- Helpers ---------- */

function normalize(params: MockReadersQuery = {}) {
  const page = Math.max(1, params.page ?? 1); // FE page 1-based
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const q = (params.q ?? "").trim().toLowerCase();
  const status = params.status ?? "ALL";
  return { page, pageSize, q, status };
}

/**
 * Sort ổn định theo tên + email
 */
function stableSort(a: Reader, b: Reader) {
  const byName = a.memberFullName.localeCompare(b.memberFullName, "vi");
  if (byName !== 0) return byName;
  return a.memberEmail.localeCompare(b.memberEmail, "vi");
}

/**
 * Hàm mock "server": filter + sort + paginate
 * TRẢ VỀ GIỐNG HỆT BE:
 * {
 *   success,
 *   data,
 *   pageInfo,
 *   timestamp
 * }
 */
export async function mockFetchReaders(
  params: MockReadersQuery = {},
): Promise<MockReadersBackendResponse> {
  const { page, pageSize, q, status } = normalize(params);

  let data = mockReaders.filter((r) => {
    const text = [r.memberFullName, r.memberEmail, r.organizationName, r.status]
      .map((x) => String(x).toLowerCase())
      .join(" ");

    const textMatch = !q || text.includes(q);
    const statusMatch = status === "ALL" ? true : r.status === status;
    return textMatch && statusMatch;
  });

  data = data.sort(stableSort);

  const totalElements = data.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));

  // BE dùng page 0-based
  const pageZeroBased = Math.min(Math.max(page - 1, 0), totalPages - 1);

  const start = pageZeroBased * pageSize;
  const end = start + pageSize;
  const pageItems = data.slice(start, end);

  const hasNext = pageZeroBased < totalPages - 1;
  const hasPrevious = pageZeroBased > 0;

  // simulate light latency
  await new Promise((res) => setTimeout(res, 60));

  return {
    success: true,
    data: pageItems,
    pageInfo: {
      page: pageZeroBased,
      size: pageSize,
      totalElements,
      totalPages,
      first: pageZeroBased === 0,
      last: pageZeroBased === totalPages - 1,
      hasNext,
      hasPrevious,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * (Tuỳ bạn có dùng hay không) – đổi status trong mockReaders,
 * ví dụ khi gọi mockChangeReaderAccess trong route mock.
 */
export function mockChangeReaderAccess(enrollmentId: string, enable: boolean) {
  const r = mockReaders.find((x) => x.enrollmentId === enrollmentId);
  if (!r) {
    return {
      success: false,
      message: `Enrollment ${enrollmentId} not found (mock)`,
    };
  }
  r.status = enable ? "ACTIVE" : "SUSPENDED";
  return { success: true };
}
