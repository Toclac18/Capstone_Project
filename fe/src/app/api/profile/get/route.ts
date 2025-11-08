// app/api/profile/get/route.ts
import { cookies } from "next/headers";
import { mockProfileDB } from "@/mock/db";

const DEFAULT_BE_BASE = "http://localhost:8080";
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  const cookieStore = await cookies();
  
  // TẠI SAO PHẢI CONVERT COOKIE → BEARER TOKEN?
  // 1. Client gửi cookie (httpOnly) đến Next.js API route ✅
  // 2. Backend CHỈ nhận Authorization header, KHÔNG đọc cookie ❌
  //    (Xem: JwtAuthenticationFilter.java line 55 - chỉ check Authorization header)
  // 3. Server-to-server call (Next.js → Backend) không tự động forward cookie
  // 4. → Route handler phải đọc cookie và convert thành Authorization header
  
  const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

  if (USE_MOCK) {
    // Extract role from query param or default to READER
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "READER";
    const profile = mockProfileDB.get(role);
    // Backend response format: { data: ProfileResponse }
    return new Response(JSON.stringify({ data: profile }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Backend chỉ nhận Authorization header, không nhận cookie
  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/profile`, {
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

