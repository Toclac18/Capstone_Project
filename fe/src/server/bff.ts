// server/bff.ts
// Proxy chung cho lớp BFF: thay cho hàng chục route handler viết tay lặp lại
// cùng một chuỗi việc (lấy cookie auth → dựng header → gọi BE → chuẩn hoá response).
//
// Route nào cần biến đổi dữ liệu thì vẫn giữ file riêng của nó; Next.js ưu tiên
// route cụ thể hơn catch-all, nên hai cách sống song song được.

import type { NextRequest } from "next/server";

import { getAuthHeader } from "@/server/auth";
import { BE_BASE } from "@/server/config";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { ROUTES } from "@/server/route-map";
import {
  HTTP_METHODS,
  type HttpMethod,
  type RouteSpec,
} from "@/server/route-types";
import { withErrorBoundary } from "@/server/withErrorBoundary";

/** Method không mang body thì không gắn Content-Type và không forward body. */
const BODYLESS: ReadonlySet<string> = new Set(["GET", "HEAD"]);

type Compiled = {
  spec: RouteSpec;
  regex: RegExp;
  params: string[];
};

function compile(spec: RouteSpec): Compiled {
  const params: string[] = [];
  const pattern = spec.fe
    .split("/")
    .map((seg) => {
      if (!seg.startsWith(":")) {
        return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
      params.push(seg.slice(1));
      // Một segment, không vượt dấu /
      return "([^/]+)";
    })
    .join("/");

  return { spec, regex: new RegExp(`^${pattern}$`), params };
}

/**
 * Biên dịch một lần ở module scope. Route tĩnh (không có `:`) đi trước route động
 * để "policies/active" không bị "policies/:id" bắt trước.
 */
const COMPILED: Compiled[] = [...ROUTES]
  .sort((a, b) => {
    const dynA = a.fe.includes(":") ? 1 : 0;
    const dynB = b.fe.includes(":") ? 1 : 0;
    if (dynA !== dynB) return dynA - dynB;
    // Đường dẫn dài hơn (cụ thể hơn) đi trước
    return b.fe.split("/").length - a.fe.split("/").length;
  })
  .map(compile);

export type Match = {
  spec: RouteSpec;
  /** URL BE đã thay tham số, CHƯA có query string */
  bePath: string;
};

/** Tìm route theo đường dẫn. Trả về null nếu không đường dẫn nào khớp. */
export function matchRoute(fePath: string): Compiled | null {
  const clean = fePath.replace(/^\/+|\/+$/g, "");
  for (const c of COMPILED) {
    if (c.regex.test(clean)) return c;
  }
  return null;
}

/** Thay `:param` trong mẫu BE bằng giá trị lấy từ đường dẫn FE. */
export function resolveBePath(c: Compiled, fePath: string): string {
  const clean = fePath.replace(/^\/+|\/+$/g, "");
  const m = c.regex.exec(clean);
  if (!m) throw new Error(`Đường dẫn "${fePath}" không khớp "${c.spec.fe}"`);

  const values = new Map<string, string>();
  c.params.forEach((name, i) => values.set(name, m[i + 1]));

  return c.spec.be
    .split("/")
    .map((seg) => {
      if (!seg.startsWith(":")) return seg;
      const v = values.get(seg.slice(1));
      if (v === undefined) {
        throw new Error(`Mẫu BE "${c.spec.be}" dùng :${seg.slice(1)} nhưng FE không có tham số đó`);
      }
      // Giá trị từ URL đã được decode bởi Next, cần encode lại khi ghép vào URL BE
      return encodeURIComponent(decodeURIComponent(v));
    })
    .join("/");
}

function notFound(fePath: string) {
  return jsonResponse(
    { success: false, message: `No BFF route for /api/${fePath}`, data: null },
    { status: 404, mode: "real" },
  );
}

function methodNotAllowed(spec: RouteSpec, method: string) {
  return jsonResponse(
    {
      success: false,
      message: `Method ${method} not allowed for /api/${spec.fe}`,
      data: null,
    },
    { status: 405, headers: { allow: spec.methods.join(", ") }, mode: "real" },
  );
}

async function handle(req: NextRequest, fePath: string): Promise<Response> {
  const method = req.method.toUpperCase();

  const matched = matchRoute(fePath);
  if (!matched) return notFound(fePath);
  if (!matched.spec.methods.includes(method as HttpMethod)) {
    return methodNotAllowed(matched.spec, method);
  }

  const bePath = resolveBePath(matched, fePath);
  const url = `${BE_BASE}/api/${bePath}${req.nextUrl.search}`;

  const headers = new Headers();

  if (!matched.spec.public) {
    const auth = await getAuthHeader(matched.spec.fe);
    if (auth) headers.set("Authorization", auth);
  }

  // BE đọc X-Forwarded-For cho audit log và lưu IP của contact ticket
  // (HttpRequestUtil.extractIpAddress, AuditLogHelper). Không forward thì
  // mọi bản ghi sẽ mang IP của chính server Next.
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff) headers.set("X-Forwarded-For", xff);

  let body: string | undefined;
  if (!BODYLESS.has(method)) {
    const raw = await req.text();
    if (raw) {
      body = raw;
      headers.set(
        "Content-Type",
        req.headers.get("content-type") ?? "application/json",
      );
    }
  }

  const upstream = await fetch(url, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

/** Handler dùng cho app/api/[...path]/route.ts. */
export function bffProxy(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  return withErrorBoundary(
    async () => {
      const { path } = await ctx.params;
      const fePath = (path ?? []).join("/");
      return handle(req, fePath);
    },
    { context: "api/[...path] (bff proxy)" },
  );
}

export { HTTP_METHODS };
