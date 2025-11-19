// src/app/api/docs-view/_utils.ts
import { headers, cookies } from "next/headers";

export const DEFAULT_BE_BASE = "http://localhost:8081";

export function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function badRequest(msg: string, code = 400) {
  return json({ error: msg }, code);
}

/** lấy base URL của BE (strip dấu / cuối nếu có) */
export function getBeBase() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_BE_BASE
  );
}

/** build header forward sang BE (Authorization + X-Forwarded-For) */
export async function buildForwardHeaders() {
  const h = await headers();
  const cookieStore = cookies();

  const headerAuth = h.get("authorization") || "";
  const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth;

  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (effectiveAuth) fh.set("Authorization", effectiveAuth);
  if (ip) fh.set("X-Forwarded-For", ip);

  return fh;
}
