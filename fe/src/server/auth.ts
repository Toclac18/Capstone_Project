// server/auth.ts
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/server/config";
import { AuthInfo } from "@/types/server-auth";
import {
  decodeJwtPayload,
  extractReaderId,
  extractEmail,
  extractRole,
  isJwtExpired,
} from "@/utils/jwt";

export async function getAuthHeader(label?: string): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (process.env.NODE_ENV === "development") {
    const prefix = label ? `[auth:${label}]` : "[auth]";
    console.log(`${prefix} COOKIE_NAME = ${COOKIE_NAME}`);
    console.log(`${prefix} Token found: ${token ? "YES" : "NO"}`);
    if (token) {
      console.log(`${prefix} Token length: ${token.length}`);
    }
  }

  if (!token) return null;
  return `Bearer ${token}`;
}

export async function getServerAuth(): Promise<AuthInfo> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(COOKIE_NAME)?.value ?? null;

  // 1. Không có token
  if (!rawToken) {
    return {
      isAuthenticated: false,
      readerId: null,
      email: null,
      role: null,
      payload: null,
    };
  }

  // 2. Decode payload
  const payload = decodeJwtPayload(rawToken);
  if (!payload) {
    return {
      isAuthenticated: false,
      readerId: null,
      email: null,
      role: null,
      payload: null,
    };
  }

  // 3. Check hết hạn
  if (isJwtExpired(payload)) {
    return {
      isAuthenticated: false,
      readerId: null,
      email: null,
      role: null,
      payload,
    };
  }

  // 4. Lấy thông tin từ payload
  const readerId = extractReaderId(payload);
  const email = extractEmail(payload);
  const role = extractRole(payload);

  return {
    isAuthenticated: !!readerId,
    readerId,
    email,
    role,
    payload,
  };
}
