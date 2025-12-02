// src/app/api/org-admin/readers/route.ts
import { mockReaders } from "@/mock/readers.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

type Reader = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  coinBalance: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

async function handleGET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // FE đang gửi page 1-based
  const page = Number(searchParams.get("page") ?? DEFAULT_PAGE);
  const pageSize = Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE);
  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "ALL";

  // ==========================
  // 1. MOCK MODE
  // ==========================
  if (USE_MOCK) {
    let items: Reader[] = mockReaders;

    if (q) {
      const keyword = q.toLowerCase();
      items = items.filter(
        (r) =>
          r.fullName.toLowerCase().includes(keyword) ||
          r.username.toLowerCase().includes(keyword) ||
          r.email.toLowerCase().includes(keyword),
      );
    }

    if (status && status !== "ALL") {
      items = items.filter((r) => r.status === status);
    }

    const total = items.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = items.slice(start, end);

    return jsonResponse(
      {
        items: pageItems,
        total,
        page,
        pageSize,
      },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  // ==========================
  // 2. REAL BE MODE
  // ==========================

  const upstreamUrl = new URL(`${BE_BASE}/api/organization/members`);

  // Spring Pageable:
  //  - page: 0-based
  //  - size: page size
  upstreamUrl.searchParams.set("page", String(Math.max(page - 1, 0)));
  upstreamUrl.searchParams.set("size", String(pageSize));

  // search param BE là 'search', không phải 'q'
  if (q) upstreamUrl.searchParams.set("search", q);
  if (status && status !== "ALL")
    upstreamUrl.searchParams.set("status", status);

  // Get authentication from shared helper
  const authHeader = await getAuthHeader();
  const fh = new Headers();
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }
  const upstream = await fetch(upstreamUrl.toString(), {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  if (!upstream.ok) {
    // Nếu BE trả JSON lỗi thì cứ trả lại
    const text = await upstream.text();
    return new Response(text || upstream.statusText, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "text/plain",
        "x-mode": "real-error",
      },
    });
  }

  const payload = await upstream.json();

  // Chuẩn hóa lại cho FE
  const items: Reader[] = payload.items ?? payload.content ?? [];

  const total: number =
    typeof payload.total === "number"
      ? payload.total
      : typeof payload.totalElements === "number"
        ? payload.totalElements
        : Array.isArray(items)
          ? items.length
          : 0;

  const backendPage: number =
    typeof payload.page === "number"
      ? payload.page
      : typeof payload.number === "number"
        ? payload.number
        : Math.max(page - 1, 0);

  const backendSize: number =
    typeof payload.pageSize === "number"
      ? payload.pageSize
      : typeof payload.size === "number"
        ? payload.size
        : pageSize;

  const currentPage = backendPage + 1; // FE vẫn dùng 1-based

  return jsonResponse(
    {
      items,
      total,
      page: currentPage,
      pageSize: backendSize,
    },
    {
      status: 200,
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
