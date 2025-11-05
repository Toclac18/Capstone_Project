// app/api/users/[id]/status/route.ts
import { mockUserDB } from "@/mock/user";
import type { User } from "@/types/user";

const DEFAULT_BE_BASE = "http://localhost:8080";

function badRequest(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

function notFound(msg: string) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 404,
    headers: { "content-type": "application/json" },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Use mock by default, or check USE_MOCK env variable
  const USE_MOCK = process.env.USE_MOCK !== "false"; // Default to true if not set
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  const { id } = await params;

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!body.status) {
    return badRequest("Status is required");
  }

  if (USE_MOCK) {
    const updatedUser = mockUserDB.updateStatus(id, body.status);
    if (!updatedUser) {
      return notFound("User not found");
    }

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Forward to backend
  const h = await import("next/headers").then((m) => m.headers());
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);

  const upstream = await fetch(`${BE_BASE}/api/users/${id}/status`, {
    method: "PATCH",
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

