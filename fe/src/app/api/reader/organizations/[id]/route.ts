import { mockOrganizationsDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (USE_MOCK) {
    const detail = mockOrganizationsDB.get(id);
    if (!detail) {
      return jsonResponse(
        { error: "Organization not found" },
        {
          status: 404,
          headers: { "content-type": "application/json", "x-mode": "mock" },
        },
      );
    }
    return jsonResponse(detail, {
      status: 200,
      headers: { "content-type": "application/json", "x-mode": "mock" },
    });
  }

  // Get authentication from shared helper
  const authHeader = await getAuthHeader();
  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }

  const upstream = await fetch(`${BE_BASE}/api/public/organizations/${id}`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  // Backend returns: { success, data: PublicOrganizationResponse, timestamp }
  const text = await upstream.text();
  try {
    const backendResponse = JSON.parse(text);
    
    // Extract data from wrapper
    const orgData = backendResponse.data || backendResponse;
    
    // Transform to FE format - PublicOrganizationResponse to OrganizationDetail
    // type is a string like "UNIVERSITY", not an object
    const transformed = {
      id: orgData.id || id,
      name: orgData.name || "",
      type: orgData.type || "", // type is already a string (e.g., "UNIVERSITY")
      email: orgData.email || "",
      hotline: orgData.hotline || "",
      logo: orgData.logo || null,
      address: orgData.address || "",
      joinDate: orgData.createdAt || new Date().toISOString(),
      memberCount: orgData.memberCount ?? 0,
      documentCount: orgData.documentCount ?? 0,
    };
    
    return jsonResponse(transformed, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    });
  } catch (error: any) {
    console.error("Error parsing organization detail response:", error);
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/organizations/[id]/route.ts/GET",
  });
