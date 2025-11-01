// src/mock/readers.ts
// Mock dataset & helpers for Admin · Readers.
// Compatible with route: src/app/api/org-admin/readers/route.ts
// Exports:
//   - mockReaders: Reader[]
//   - mockChangeReaderAccess(userId: string, enable: boolean)
//   - mockFetchReaders(params?): optional helper usable elsewhere

export type ReaderStatus = "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export type Reader = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: ReaderStatus;
  coinBalance: number;
};

export type MockReadersQuery = {
  page?: number; // 1-based
  pageSize?: number; // e.g., 10, 20, 50
  q?: string;
  status?: ReaderStatus | "ALL";
};

export type MockReadersListResponse = {
  items: Reader[];
  total: number;
  page: number;
  pageSize: number;
};

// ---------- Seed (fixed small set for deterministic testing) ----------
const seed: Reader[] = [
  {
    id: "6b1f9d2a-21b0-4d01-8f7a-d3a3d9b9b111",
    fullName: "Alice Nguyen",
    username: "alice",
    email: "alice@example.com",
    status: "ACTIVE",
    coinBalance: 120,
  },
  {
    id: "f8fd1b1c-7a6c-4b11-9f0a-6f1310a0c222",
    fullName: "Bob Tran",
    username: "bob",
    email: "bob@example.com",
    status: "SUSPENDED",
    coinBalance: 5,
  },
  {
    id: "7d9018dc-a86f-4a60-9001-70ac70d33aa3",
    fullName: "Charlie Le",
    username: "charlie",
    email: "charlie@example.com",
    status: "ACTIVE",
    coinBalance: 80,
  },
];

// ---------- Auto-generate more rows for realistic pagination ----------
function generateExtra(n: number): Reader[] {
  const rows: Reader[] = [];
  for (let i = 1; i <= n; i++) {
    const id = `${1000 + i}`; // numeric id strings for stable sort fallback
    const status: ReaderStatus =
      i % 7 === 0
        ? "SUSPENDED"
        : i % 9 === 0
          ? "PENDING_VERIFICATION"
          : "ACTIVE";
    rows.push({
      id,
      fullName: `Reader ${i}`,
      username: `reader${i}`,
      email: `reader${i}@example.com`,
      status,
      coinBalance: 1000 + i * 3,
    });
  }
  return rows;
}

// Public dataset export (seed + generated extras)
export const mockReaders: Reader[] = [...seed, ...generateExtra(150)];

// ---------- Helpers ----------
function normalize(params: MockReadersQuery = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const q = (params.q ?? "").trim().toLowerCase();
  const status = params.status ?? "ALL";
  return { page, pageSize, q, status };
}

function stableSort(a: Reader, b: Reader) {
  const byName = a.fullName.localeCompare(b.fullName);
  if (byName !== 0) return byName;
  // Fallback numeric id if possible; else lexicographic
  const ai = Number(a.id);
  const bi = Number(b.id);
  if (Number.isFinite(ai) && Number.isFinite(bi)) return ai - bi;
  return String(a.id).localeCompare(String(b.id));
}

// Optional server-like helper: filter + sort + paginate (can be used by a route)
export async function mockFetchReaders(
  params: MockReadersQuery = {},
): Promise<MockReadersListResponse> {
  const { page, pageSize, q, status } = normalize(params);

  let data = mockReaders.filter((r) => {
    const textMatch =
      !q ||
      [r.fullName, r.username, r.email, r.status]
        .map((x) => String(x).toLowerCase())
        .some((x) => x.includes(q));
    const statusMatch = status === "ALL" ? true : r.status === status;
    return textMatch && statusMatch;
  });

  data = data.sort(stableSort);

  const total = data.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = data.slice(start, end);

  // simulate light latency (optional)
  await new Promise((res) => setTimeout(res, 60));

  return { items, total, page, pageSize };
}

// Change access state: enable=true => ACTIVE, enable=false => SUSPENDED
export function mockChangeReaderAccess(userId: string, enable: boolean) {
  const r = mockReaders.find((x) => x.id === userId);
  if (!r) {
    return { success: false, message: `User ${userId} not found (mock)` };
  }
  r.status = enable ? "ACTIVE" : "SUSPENDED";
  return { success: true };
}
