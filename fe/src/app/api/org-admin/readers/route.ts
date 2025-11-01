// src/app/api/org-admin/readers/route.ts
import { headers } from "next/headers";
import { mockReaders } from "src/mock/readers";

const DEFAULT_BE_BASE = "http://localhost:8081";

export async function GET() {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  if (USE_MOCK) {
    return new Response(
      JSON.stringify({ items: mockReaders, total: mockReaders.length }),
      {
        status: 200,
        headers: { "content-type": "application/json", "x-mode": "mock" },
      },
    );
  }

  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers();
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);
  if (ip) fh.set("X-Forwarded-For", ip);

  const upstream = await fetch(`${BE_BASE}/api/org-admin/readers`, {
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
