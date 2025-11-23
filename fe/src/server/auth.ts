// server/auth.ts
// Helper to build Authorization header from JWT stored in HttpOnly cookie
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/server/config";

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
