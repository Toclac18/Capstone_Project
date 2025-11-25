// app/api/organizations/[id]/status/route.ts

import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { mockUpdateOrganizationStatus } from "@/mock/organizationsMock";

async function handlePATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body) {
    return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.status) {
    return jsonResponse({ error: "Status is required" }, { status: 400 });
  }

  if (USE_MOCK) {
    const result = mockUpdateOrganizationStatus(id, body.status);
    if (!result) {
      return jsonResponse({ error: "Organization not found" }, {
        status: 404,
        mode: "mock",
      });
    }
    return jsonResponse(result, { status: 200, mode: "mock" });
  }

  try {
    const authHeader = await getAuthHeader();

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/organizations/${id}/status`, {
      method: "PATCH",
      headers: fh,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    return proxyJsonResponse(upstream, { mode: "real" });
  } catch (e: any) {
    return jsonResponse(
      { message: "Organization status update failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const PATCH = (...args: Parameters<typeof handlePATCH>) =>
  withErrorBoundary(() => handlePATCH(...args), {
    context: "api/organizations/[id]/status/route.ts/PATCH",
  });
