export type ImportStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type RowResult = {
  row: number;
  fullName: string;
  username: string;
  email: string;
  imported: boolean;
  emailSent: boolean;
  error?: string | null;
};

export type ImportJob = {
  id: string;
  fileName: string;
  createdAt: string;
  createdBy: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  status: ImportStatus;
  results: RowResult[];
};

// ---- helpers ----
function isoWithOffset(d: Date) {
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const ms = pad(d.getMilliseconds(), 3);
  const tzo = -d.getTimezoneOffset();
  const sign = tzo >= 0 ? "+" : "-";
  const oh = pad(Math.floor(Math.abs(tzo) / 60));
  const om = pad(Math.abs(tzo) % 60);
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}.${ms}${sign}${oh}:${om}`;
}

function nowIso() {
  return isoWithOffset(new Date());
}

const jobA: ImportJob = {
  id: "imp-20241015-001",
  fileName: "users_batch_oct15.xlsx",
  createdAt: isoWithOffset(new Date("2024-10-15T08:10:00")),
  createdBy: "alice.nguyen",
  totalRows: 5,
  processedRows: 5,
  successCount: 4,
  failureCount: 1,
  status: "COMPLETED",
  results: [
    {
      row: 2,
      fullName: "Jane Roe",
      username: "jroe",
      email: "jroe@ex.com",
      imported: true,
      emailSent: true,
    },
    {
      row: 3,
      fullName: "Mark Li",
      username: "mli",
      email: "mli@ex.com",
      imported: true,
      emailSent: true,
    },
    {
      row: 4,
      fullName: "Zoë K",
      username: "zoek",
      email: "zoek@ex.com",
      imported: true,
      emailSent: true,
    },
    {
      row: 5,
      fullName: "Chris P",
      username: "chrisp",
      email: "chrisp@ex.com",
      imported: false,
      emailSent: false,
      error: "Duplicate username",
    },
    {
      row: 6,
      fullName: "Ana M",
      username: "anam",
      email: "anam@ex.com",
      imported: true,
      emailSent: true,
    },
  ],
};

const jobB: ImportJob = {
  id: "imp-20241102-009",
  fileName: "readers_nov.xlsx",
  createdAt: isoWithOffset(new Date("2024-11-02T14:30:00")),
  createdBy: "bob.tran",
  totalRows: 3,
  processedRows: 3,
  successCount: 3,
  failureCount: 0,
  status: "COMPLETED",
  results: [
    {
      row: 2,
      fullName: "Hana T",
      username: "hanat",
      email: "hana@ex.com",
      imported: true,
      emailSent: true,
    },
    {
      row: 3,
      fullName: "Ivo N",
      username: "ivon",
      email: "ivo@ex.com",
      imported: true,
      emailSent: true,
    },
    {
      row: 4,
      fullName: "Quynh P",
      username: "quynhp",
      email: "quynh@ex.com",
      imported: true,
      emailSent: true,
    },
  ],
};

const extras: ImportJob[] = Array.from({ length: 20 }).map((_, i) => {
  const idx = i + 1;
  const ok = idx % 5 !== 0;
  const created = new Date(2025, 0, Math.min(28, (idx % 27) + 1), idx % 23);
  return {
    id: `imp-2025${String(100 + idx).slice(1)}-${String(idx).padStart(3, "0")}`,
    fileName: `batch_${idx}.xlsx`,
    createdAt: isoWithOffset(created),
    createdBy: idx % 2 ? "system" : "charlie.le",
    totalRows: 20,
    processedRows: 20,
    successCount: ok ? 20 : 17,
    failureCount: ok ? 0 : 3,
    status: ok ? "COMPLETED" : "FAILED",
    results: Array.from({ length: 20 }).map((__, r) => ({
      row: r + 2,
      fullName: `User ${idx}-${r}`,
      username: `user${idx}_${r}`,
      email: `user${idx}_${r}@example.com`,
      imported: ok,
      emailSent: ok,
      error: ok ? null : r % 7 === 0 ? "Email invalid" : null,
    })),
  };
});

export const mockImports: ImportJob[] = [jobA, jobB, ...extras];

export type ImportListQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: ImportStatus | "ALL";
};
export type ImportListResponse = {
  items: Omit<ImportJob, "results">[];
  total: number;
  page: number;
  pageSize: number;
};

function normalize(q: ImportListQuery = {}) {
  const page = Math.max(1, q.page ?? 1);
  const pageSize = Math.max(1, q.pageSize ?? 10);
  const kw = (q.q ?? "").trim().toLowerCase();
  const status = q.status ?? "ALL";
  return { page, pageSize, kw, status };
}

export async function mockFetchImports(
  q: ImportListQuery = {},
): Promise<ImportListResponse> {
  const { page, pageSize, kw, status } = normalize(q);
  let data = mockImports.slice();
  if (kw) {
    data = data.filter((x) =>
      [x.fileName, x.createdBy, x.status].some((v) =>
        String(v).toLowerCase().includes(kw),
      ),
    );
  }
  if (status !== "ALL") data = data.filter((x) => x.status === status);
  data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = data.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = data.slice(start, end).map(({ ...rest }) => rest);
  await new Promise((res) => setTimeout(res, 60)); // latency
  return { items, total, page, pageSize };
}

export async function mockFetchImportDetail(
  id: string,
): Promise<ImportJob | null> {
  await new Promise((res) => setTimeout(res, 40));
  return mockImports.find((x) => x.id === id) ?? null;
}

export async function mockCreateImport(
  file: File,
  createdBy: string,
): Promise<ImportJob> {
  await new Promise((r) => setTimeout(r, 120)); // giả lập upload

  const id = `imp-${cryptoRandom()}`;
  const job: ImportJob = {
    id,
    fileName: file.name,
    createdAt: nowIso(),
    createdBy,
    totalRows: 0,
    processedRows: 0,
    successCount: 0,
    failureCount: 0,
    status: "PROCESSING",
    results: [],
  };

  mockImports.unshift(job);

  setTimeout(() => {
    const results: RowResult[] = [
      {
        row: 2,
        fullName: "Sample A",
        username: "samplea",
        email: "a@ex.com",
        imported: true,
        emailSent: true,
      },
      {
        row: 3,
        fullName: "Sample B",
        username: "sampleb",
        email: "b@ex.com",
        imported: false,
        emailSent: false,
        error: "Duplicate email",
      },
      {
        row: 4,
        fullName: "Sample C",
        username: "samplec",
        email: "c@ex.com",
        imported: true,
        emailSent: true,
      },
      {
        row: 5,
        fullName: "Sample D",
        username: "sampled",
        email: "d@ex.com",
        imported: true,
        emailSent: true,
      },
    ];
    const idx = mockImports.findIndex((x) => x.id === id);
    if (idx >= 0) {
      const ok = results.filter((r) => r.imported).length;
      mockImports[idx] = {
        ...mockImports[idx],
        totalRows: results.length,
        processedRows: results.length,
        successCount: ok,
        failureCount: results.length - ok,
        status: "COMPLETED",
        results,
      };
    }
  }, 1200);

  return job;
}

// simple id
function cryptoRandom() {
  // use milliseconds and a small random to keep it readable
  return `${Date.now().toString(16)}-${Math.floor(Math.random() * 1e6).toString(16)}`;
}