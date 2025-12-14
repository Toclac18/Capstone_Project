import { mockOrganizationsDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

async function handleGET() {
  if (USE_MOCK) {
    const { items, total } = mockOrganizationsDB.list();
    return jsonResponse(
      { items, total },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  // Get authentication from shared helper
  const authHeader = await getAuthHeader();
  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }

  const upstream = await fetch(
    `${BE_BASE}/api/reader/enrollments/organizations`,
    {
      method: "GET",
      headers: fh,
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  // Backend returns PagedResponse<PublicOrganizationResponse>
  const text = await upstream.text();
  try {
    const backendResponse = JSON.parse(text);

    // Backend format: { success, message, data: OrgEnrollmentResponse[], pageInfo: { page, size, totalElements, ... }, timestamp }
    const enrollments = Array.isArray(backendResponse.data)
      ? backendResponse.data
      : [];
    const pageInfo = backendResponse.pageInfo || {};

    // Transform to FE format - OrgEnrollmentResponse contains organizationId, organizationName, and respondedAt
    const transformed = {
      items: enrollments.map((enrollment: any) => ({
        id: enrollment.organizationId || enrollment.id,
        name: enrollment.organizationName || "",
        type: enrollment.organizationType || "",
        logo: enrollment.organizationLogo || null,
        joinDate: enrollment.respondedAt || "",
      })),
      total: pageInfo.totalElements ?? enrollments.length,
    };

    return jsonResponse(transformed, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    });
  } catch (error: any) {
    console.error("Error parsing organizations response:", error);
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/organizations/route.ts/GET",
  });
