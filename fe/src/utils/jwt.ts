// src/common/jwt.ts

export type JwtPayload = {
  iss?: string;
  sub?: string;
  iat?: number;
  exp?: number;
  email?: string;
  role?: string;
  orgId?: string;
  [key: string]: any;
};

/**
 * Strip "Bearer " prefix
 */
function stripBearer(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
}

/**
 * Decode phần payload của JWT (không verify signature -> chỉ thực hiện trên spring).
 *
 * Lưu ý:
 * - Chỉ dùng ở FE / BFF để hiển thị UI (ví dụ: sidebar theo role, lấy readerId…)
 * - Không dùng để quyết định quyền truy cập backend.
 * - Việc verify chữ ký + exp vẫn do Spring Security xử lý.
 *
 * Chạy cả:
 * - Server-side (Next API route / server component)
 * - Client-side (browser)
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  if (!token) return null;

  try {
    const stripped = stripBearer(token);
    const segments = stripped.split(".");
    if (segments.length < 2) return null;

    const payloadSeg = segments[1];

    const base64 = payloadSeg.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    let json: string;

    if (typeof window === "undefined") {
      // Server-side (Node.js) trên Next.js
      json = Buffer.from(padded, "base64").toString("utf8");
    } else {
      // Browser
      json = window.atob(padded);
    }

    const obj = JSON.parse(json);
    return obj as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Lấy readerId từ payload:
 * - ưu tiên "sub" vì BE setSubject(userId.toString())
 * - giữ backward-compat cho readerId / reader_id nếu sau này cần
 */
export function extractReaderId(payload: JwtPayload | null): string | null {
  if (!payload) return null;
  return (
    (payload.sub as string | undefined) ??
    (payload.readerId as string | undefined) ??
    (payload.reader_id as string | undefined) ??
    null
  );
}

/** Lấy email từ JWT **/
export function extractEmail(payload: JwtPayload | null): string | null {
  if (!payload) return null;
  return (payload.email as string | undefined) ?? null;
}

/** Lấy role từ JWT **/
export function extractRole(payload: JwtPayload | null): string | null {
  if (!payload) return null;
  return (payload.role as string | undefined) ?? null;
}

/** Lấy orgId từ JWT (nếu BE có claim) **/
export function extractOrgId(payload: JwtPayload | null): string | null {
  if (!payload) return null;
  return (payload.orgId as string | undefined) ?? null;
}

/** Kiểm tra token đã hết hạn chưa (dùng exp, đơn vị giây) **/
export function isJwtExpired(payload: JwtPayload | null): boolean | null {
  if (!payload || !payload.exp) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= payload.exp;
}
