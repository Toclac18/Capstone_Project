// src/app/api/org-admin/reader-change-access/route.ts
import { headers, cookies } from "next/headers";
import { mockChangeReaderAccess } from "@/mock/readers";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";

function badRequest(msg: string, code = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status: code,
    headers: { "content-type": "application/json" },
  });
}

async function handlePOST(req: Request) {
  // validate body
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

  // MOCK path
  if (USE_MOCK) {
    const result = mockChangeReaderAccess(body.userId, body.enable);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 404,
      headers: { "content-type": "application/json", "x-mode": "mock" },
    });
  }

  // REAL: build Authorization header (prefer header, fallback cookie)
  const h = await headers();
  const cookieStore = cookies();

  const headerAuth = h.get("authorization") || "";
  const cookieAuth = (await cookieStore).get("Authorization")?.value || "";
  const effectiveAuth = headerAuth || cookieAuth; // <-- quan trọng

  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();

  const fh = new Headers({ "Content-Type": "application/json" });
  if (effectiveAuth) fh.set("Authorization", effectiveAuth); // JwtFilter đọc từ header
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

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/org-admin/reader-change-access/route.ts/POST",
  });
