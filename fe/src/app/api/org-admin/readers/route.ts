// src/app/api/org-admin/readers/route.ts
import { mockReaders } from "@/mock/readers";
import { headers } from "next/headers";

const DEFAULT_BE_BASE = "http://localhost:8081";

type Reader = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  coinBalance: number;
};

// Helpers
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
  // filter
  let filtered = data.filter((r) => {
    const textMatch =
      !q ||
      [r.fullName, r.username, r.email, r.status]
        .map((x) => String(x).toLowerCase())
        .some((x) => x.includes(q));
    const statusMatch = status === "ALL" ? true : r.status === status;
    return textMatch && statusMatch;
  });

  // stable sort to tránh “nhảy hàng” giữa các request
  filtered = filtered.sort((a, b) => {
    const byName = a.fullName.localeCompare(b.fullName);
    if (byName !== 0) return byName;
    // fallback theo id dạng số nếu có thể
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

export async function GET(req: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

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

  // Forward headers (auth, cookie, ip)
  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers();
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);
  if (ip) fh.set("X-Forwarded-For", ip);

  // Forward query params to BE
  const upstreamUrl = new URL(`${BE_BASE}/api/org-admin/readers`);
  upstreamUrl.searchParams.set("page", String(page));
  upstreamUrl.searchParams.set("pageSize", String(pageSize));
  if (q) upstreamUrl.searchParams.set("q", q);
  if (status && status !== "ALL")
    upstreamUrl.searchParams.set("status", status);

  const upstream = await fetch(upstreamUrl.toString(), {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}
