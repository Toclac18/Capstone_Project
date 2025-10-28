// src/app/api/auth/logout/route.ts
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

export async function POST() {
  (await cookies()).delete(COOKIE_NAME);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
