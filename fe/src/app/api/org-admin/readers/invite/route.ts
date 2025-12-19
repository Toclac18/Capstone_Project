// src/app/api/org-admin/readers/invite/route.ts
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { jsonResponse, badRequest } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

async function handlePOST(req: Request) {
  // read raw body
  const raw = await req.text();

  if (USE_MOCK) {
    try {
      const body = JSON.parse(raw || "{}");
      const enrollmentId = body.enrollmentId;
      if (!enrollmentId) return badRequest("Missing enrollmentId");

      return jsonResponse(
        { success: true, message: "Re-invite sent (mock)" },
        { status: 200, headers: { "x-mode": "mock" } },
      );
    } catch {
      return badRequest("Invalid JSON");
    }
  }

  const auth = await getAuthHeader();

  const upstream = await fetch(`${BE_BASE}/api/organization/members/invite`, {
    method: "POST",
    headers: {
      ...(auth ? { Authorization: auth } : {}),
      "Content-Type": "application/json",
    },
    body: raw,
  });

  const text = await upstream.text();

  try {
    const json = JSON.parse(text);
    return jsonResponse(json, {
      status: upstream.status,
      headers: { "x-mode": "real" },
    });
  } catch {
    return new Response(text, { status: upstream.status });
  }
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/org-admin/readers/invite/route.ts/POST",
  });
