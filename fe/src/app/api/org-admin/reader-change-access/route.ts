// src/app/api/org-admin/reader-change-access/route.ts
import { mockChangeReaderAccess } from "@/mock/readers.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { badRequest } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

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

  const authHeader = await getAuthHeader("org-admin-imports-upload");

  const fh = new Headers();
  if (authHeader) fh.set("Authorization", authHeader);

  const ip = fh.get("x-forwarded-for")?.split(",")[0]?.trim();

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
