// app/api/organizations/[id]/route.ts

import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { mockGetOrganizationById } from "@/mock/organizations.mock";

async function handleGET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (USE_MOCK) {
    const org = mockGetOrganizationById(id);
    if (!org) {
      return jsonResponse(
        { error: "Organization not found" },
        {
          status: 404,
          mode: "mock",
        },
      );
    }
    return jsonResponse(org, { status: 200, mode: "mock" });
  }

  try {
    const authHeader = await getAuthHeader();

    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/organizations/${id}`, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    return proxyJsonResponse(upstream, { mode: "real" });
  } catch (e: any) {
    return jsonResponse(
      { message: "Organization fetch failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/organizations/[id]/route.ts/GET",
  });
