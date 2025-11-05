// app/api/profile/update/route.ts
import { cookies } from "next/headers";
import { mockProfileDB, type ProfileData } from "@/mock/db";

const DEFAULT_BE_BASE = "http://localhost:8080";
const COOKIE_NAME = process.env.COOKIE_NAME || "access_token";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  let body: Partial<ProfileData>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (USE_MOCK) {
    const updated = mockProfileDB.update(body);
    // Backend response format: { data: ProfileResponse }
    return new Response(JSON.stringify({ data: updated }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const cookieStore = await cookies();
  
  // TẠI SAO PHẢI CONVERT COOKIE → BEARER TOKEN?
  // Backend CHỈ nhận Authorization header, KHÔNG đọc cookie
  // (Xem: JwtAuthenticationFilter.java - chỉ check Authorization header)
  const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value;
  const bearerToken = tokenFromCookie ? `Bearer ${tokenFromCookie}` : "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (bearerToken) {
    fh.set("Authorization", bearerToken);
  }

  const upstream = await fetch(`${BE_BASE}/api/profile`, {
    method: "PUT",
    headers: fh,
    body: JSON.stringify(body),
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

