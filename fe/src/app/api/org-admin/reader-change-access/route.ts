import { headers } from "next/headers";
import { mockChangeReaderAccess } from "@/mock/readers";

const DEFAULT_BE_BASE = "http://localhost:8081";

function badRequest(msg: string, code = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status: code,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  const USE_MOCK = process.env.USE_MOCK === "true";
  const BE_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    DEFAULT_BE_BASE;

  let body: { userId?: string; enable?: boolean };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  if (!body.userId || String(body.userId).trim() === "") {
    return badRequest(`Field "userId" is required`);
  }
  if (typeof body.enable !== "boolean") {
    return badRequest(`Field "enable" (boolean) is required`);
  }

  if (USE_MOCK) {
    const result = mockChangeReaderAccess(body.userId, body.enable);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // REAL: forward Authorization & Cookie sang BE
  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);
  if (ip) fh.set("X-Forwarded-For", ip);

  const upstream = await fetch(
    `${BE_BASE}/api/org-admin/reader-change-access`,
    {
      method: "POST",
      headers: fh,
      body: JSON.stringify({ userId: body.userId, enable: body.enable }),
      cache: "no-store",
    },
  );

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
