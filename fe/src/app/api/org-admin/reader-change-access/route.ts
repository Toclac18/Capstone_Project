// src/app/api/org-admin/reader-change-access/route.ts
import { mockChangeReaderAccess } from "@/mock/readers.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { badRequest, proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

type ChangeEnrollmentStatusBody = {
  enrollmentId?: string;
  status?: string;
};

async function handlePOST(req: Request) {
  let body: ChangeEnrollmentStatusBody;

  // 1. Parse JSON
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  // 2. Validate input
  if (!body.enrollmentId) {
    return badRequest("Missing enrollmentId");
  }
  if (!body.status) {
    return badRequest("Missing status");
  }

  // MOCK path
  if (USE_MOCK) {
    const result = mockChangeReaderAccess(body.enrollmentId, body.status);
    return jsonResponse(result, {
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
    `${BE_BASE}/api/org-enrollments/${body.enrollmentId}/status`,
    {
      method: "PUT",
      headers: fh,
      body: JSON.stringify({ status: body.status }),
      cache: "no-store",
    },
  );

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/organization/change-reader-access/route.ts/POST",
  });
