// src/mock/readers.mock.ts

import {
  OrgEnrollStatus,
  OrgEnrollment,
  OrgEnrollmentListResponse,
} from "@/services/org-admin-reader.service";

export type MockReadersQuery = {
  page?: number; // 1-based
  pageSize?: number; // ví dụ 10, 20, 50
  q?: string;
  status?: OrgEnrollStatus | "ALL";
};

/* ---------- Seed cố định (ít bản ghi) ---------- */

const seed: OrgEnrollment[] = [
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
    enrollmentId: "join-1",
    memberId: "member-join-1",
    memberEmail: "alice@example.com",
    memberFullName: "Alice Nguyen",
    memberAvatarUrl: null,
    organizationId: "org-vnu",
    organizationName: "Đại học Quốc gia Hà Nội",
    organizationType: "University",
    status: "JOINED",
    invitedAt: "2025-10-01T08:00:00.000Z",
    respondedAt: "2025-10-02T09:30:00.000Z",
  },
  {
    enrollmentId: "removed-1",
    memberId: "member-removed-1",
    memberEmail: "bob@example.com",
    memberFullName: "Bob Tran",
    memberAvatarUrl: null,
    organizationId: "org-ams",
    organizationName: "Trường THPT Chuyên Amsterdam",
    organizationType: "HighSchool",
    status: "REMOVED",
    invitedAt: "2025-09-10T08:00:00.000Z",
    respondedAt: null,
  },
];

/* ---------- Generate thêm dữ liệu giả ---------- */

function generateExtra(count: number): OrgEnrollment[] {
  const rows: OrgEnrollment[] = [];
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

    const status: OrgEnrollStatus =
      i % 5 === 0 ? "PENDING_INVITE" : i % 3 === 0 ? "REMOVED" : "JOINED";

    const baseDate = new Date("2025-09-01T08:00:00.000Z");
    baseDate.setDate(baseDate.getDate() + i);

    const invitedAt = baseDate.toISOString();
    const respondedAt =
      status === "JOINED"
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

export const mockReaders: OrgEnrollment[] = [...seed, ...generateExtra(80)];

/* ---------- Helpers ---------- */

function normalize(params: MockReadersQuery = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const q = (params.q ?? "").trim().toLowerCase();
  const status = params.status ?? "ALL";
  return { page, pageSize, q, status };
}

function stableSort(a: OrgEnrollment, b: OrgEnrollment) {
  const byName = a.memberFullName.localeCompare(b.memberFullName, "vi");
  if (byName !== 0) return byName;
  return a.memberEmail.localeCompare(b.memberEmail, "vi");
}

/**
 * Mock "server": filter + sort + paginate
 *
 * TRẢ VỀ ĐÚNG FORMAT BE:
 * {
 *   success: true,
 *   data,
 *   pageInfo,
 *   timestamp
 * }
 */
export async function mockFetchReaders(
  params: MockReadersQuery = {},
): Promise<OrgEnrollmentListResponse> {
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
  const pageZeroBased = Math.min(Math.max(page - 1, 0), totalPages - 1);

  const start = pageZeroBased * pageSize;
  const end = start + pageSize;
  const pageItems = data.slice(start, end);

  const hasNext = pageZeroBased < totalPages - 1;
  const hasPrevious = pageZeroBased > 0;

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
 * Đổi status trong mockReaders (để BE sau này bắt chước API này):
 *
 *  - enable = true  => JOINED
 *  - enable = false => REMOVED
 *
 *  PENDING_INVITE không được gọi hàm này (UI không cho action).
 */
export function mockChangeReaderAccess(enrollmentId: string, enable: boolean) {
  const r = mockReaders.find((x) => x.enrollmentId === enrollmentId);
  if (!r) {
    return {
      success: false,
      message: `Enrollment ${enrollmentId} not found (mock)`,
    };
  }

  r.status = enable ? "JOINED" : "REMOVED";
  return { success: true };
}
