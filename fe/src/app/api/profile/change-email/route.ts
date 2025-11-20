// app/api/profile/change-email/route.ts
import { headers } from "next/headers";
import { mockProfileDB } from "@/mock/db";
import { BE_BASE, USE_MOCK } from "@/server/config";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { newEmail: string; password: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (USE_MOCK) {
    mockProfileDB.update({ email: body.newEmail });
    return new Response(
      JSON.stringify({
        message: "Email changed successfully. (mock)",
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

  const upstream = await fetch(`${BE_BASE}/api/profile/change-email`, {
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