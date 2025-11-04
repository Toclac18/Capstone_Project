// app/api/profile/change-password/route.ts
import { headers } from "next/headers";

const DEFAULT_BE_BASE = "http://localhost:8080";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  let body: { currentPassword: string; newPassword: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (USE_MOCK) {
    return new Response(
      JSON.stringify({
        message: "Password changed successfully. (mock)",
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      }
    );
  }

  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);

  const upstream = await fetch(`${BE_BASE}/api/profile/change-password`, {
    method: "POST",
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

