// src/common/jwt.ts

export type JwtPayload = {
  // standard claims
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
 * Strip "Bearer " prefix nếu có
 */
function stripBearer(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
}

/**
 * Decode phần payload của JWT (không verify signature).
 * Decode được trên client (browser) vì dùng atob().
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  if (!token) return null;

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stripped = stripBearer(token);
    const segments = stripped.split(".");
    if (segments.length < 2) return null;

    const payloadSeg = segments[1];

    const base64 = payloadSeg.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    const json = window.atob(padded);
    const obj = JSON.parse(json);

    return obj as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Lấy readerId từ payload:
 * - ưu tiên "sub" vì BE setSubject(String.valueOf(readerId))
 * - giữ backward-compat cho readerId / reader_id
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

/** Lấy orgId từ JWT **/
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
