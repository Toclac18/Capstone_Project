// src/app/api/org-admin/readers/route.ts
import { mockReaders } from "@/mock/readersMock";
import { headers, cookies } from "next/headers";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { getAuthHeader } from "@/server/auth";

type Reader = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  coinBalance: number;
};

// helpers
function toInt(v: string | null, def: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}
function normalizeParams(url: URL) {
  const page = toInt(url.searchParams.get("page"), 1);
  const pageSize = toInt(url.searchParams.get("pageSize"), 10);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status =
    (url.searchParams.get("status") as Reader["status"] | "ALL") || "ALL";
  return { page, pageSize, q, status };
}
function filterSortPaginate(
  data: Reader[],
  { page, pageSize, q, status }: ReturnType<typeof normalizeParams>,
) {
  let filtered = data.filter((r) => {
    const textMatch =
      !q ||
      [r.fullName, r.username, r.email, r.status]
        .map((x) => String(x).toLowerCase())
        .some((x) => x.includes(q));
    const statusMatch = status === "ALL" ? true : r.status === status;
    return textMatch && statusMatch;
  });
  filtered = filtered.sort((a, b) => {
    const byName = a.fullName.localeCompare(b.fullName);
    if (byName !== 0) return byName;
    const ai = Number(a.id);
    const bi = Number(b.id);
    if (Number.isFinite(ai) && Number.isFinite(bi)) return ai - bi;
    return String(a.id).localeCompare(String(b.id));
  });
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = filtered.slice(start, end);
  return { items, total, page, pageSize };
}

async function handleGET(req: Request) {
  const url = new URL(req.url);
  const { page, pageSize, q, status } = normalizeParams(url);

  if (USE_MOCK) {
    const { items, total } = filterSortPaginate(mockReaders as Reader[], {
      page,
      pageSize,
      q,
      status,
    });
    return new Response(JSON.stringify({ items, total, page, pageSize }), {
      status: 200,
      headers: { "content-type": "application/json", "x-mode": "mock" },
    });
  }

  // headers → build Authorization
  const h = await headers();
  const cookieStore = cookies();
  const headerAuth = h.get("authorization") || "";
  const jwtAuth = (await getAuthHeader("api/org-admin/readers/route.ts")) || "";
  const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
  const effectiveAuth = jwtAuth || headerAuth || cookieAuth;

  // build upstream URL
  const upstreamUrl = new URL(`${BE_BASE}/api/org-admin/readers`);
  upstreamUrl.searchParams.set("page", String(page));
  upstreamUrl.searchParams.set("pageSize", String(pageSize));
  if (q) upstreamUrl.searchParams.set("q", q);
  if (status && status !== "ALL")
    upstreamUrl.searchParams.set("status", status);

  const upstream = await fetch(upstreamUrl.toString(), {
    method: "GET",
    headers: {
      ...(effectiveAuth ? { Authorization: effectiveAuth } : {}),
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  // parse & normalize
  const raw = await upstream.json().catch(() => ({}));
  const payload = raw?.data ?? raw; // BE có thể bọc trong {data: ...}

  const items = payload?.content ?? payload?.items ?? [];
  const total =
    payload?.totalElements ??
    payload?.total ??
    (Array.isArray(items) ? items.length : 0);
  const currentPage =
    (typeof payload?.number === "number"
      ? payload.number + 1
      : (payload?.page ?? page)) || page;
  const size =
    payload?.size ??
    payload?.pageSize ??
    (typeof pageSize === "number" ? pageSize : 10);

  return new Response(
    JSON.stringify({
      items,
      total,
      page: currentPage,
      pageSize: size,
    }),
    {
      status: upstream.status,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    },
  );
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/org-admin/readers/route.ts/GET",
  });
