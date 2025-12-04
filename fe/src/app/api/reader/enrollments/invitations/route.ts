import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

async function handleGET(req: Request) {
  if (USE_MOCK) {
    // Mock data for development
    const mockInvitations = {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };
    return jsonResponse(mockInvitations, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  // Get authentication from shared helper
  const authHeader = await getAuthHeader();
  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }

  // Parse query parameters for pagination
  const url = new URL(req.url);
  const page = url.searchParams.get("page") || "0";
  const size = url.searchParams.get("size") || "10";

  // Build upstream URL
  const upstreamUrl = new URL(`${BE_BASE}/api/reader/enrollments/invitations`);
  upstreamUrl.searchParams.set("page", page);
  upstreamUrl.searchParams.set("size", size);

  const upstream = await fetch(upstreamUrl.toString(), {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  // Backend returns: { success, data: [...], pageInfo: {...}, timestamp }
  const text = await upstream.text();
  try {
    const backendResponse = JSON.parse(text);
    
    // Backend format: { success, data: OrgEnrollmentResponse[], pageInfo: {...}, timestamp }
    const invitations = Array.isArray(backendResponse.data) ? backendResponse.data : [];
    const pageInfo = backendResponse.pageInfo || {};
    
    // Transform to PagedResponse format
    const response = {
      content: invitations,
      totalElements: pageInfo.totalElements ?? 0,
      totalPages: pageInfo.totalPages ?? 0,
      size: pageInfo.size ?? parseInt(size, 10),
      number: pageInfo.page ?? parseInt(page, 10),
      first: pageInfo.first ?? true,
      last: pageInfo.last ?? true,
    };
    
    return jsonResponse(response, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    });
  } catch (error: any) {
    console.error("Error parsing invitations response:", error);
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/enrollments/invitations/route.ts/GET",
  });

