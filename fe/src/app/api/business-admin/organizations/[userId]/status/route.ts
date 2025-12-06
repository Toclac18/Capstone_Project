import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  const body = await request.json().catch(() => ({}));
  const { status } = body;

  if (!status) {
    return jsonResponse(
      { error: "Status is required" },
      {
        status: 400,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  if (USE_MOCK) {
    return jsonResponse(
      {
        id: userId,
        name: "Mock Organization",
        status: status,
      },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  const authHeader = await getAuthHeader("organizations");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const url = `${BE_BASE}/api/admin/organizations/${userId}/status`;

  const upstream = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ status }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json();
  // Backend returns AdminOrganizationResponse directly
  const org = responseData?.data || responseData;

  // Map AdminOrganizationResponse to Organization format
  const mappedOrganization = {
    id: org.organizationId || org.userId || org.id,
    userId: org.userId || org.id,
    organizationId: org.organizationId || org.userId || org.id,
    name: org.orgName || org.name || "Unknown Organization",
    type: org.orgType || org.type || "TYPE1",
    email: org.orgEmail || org.email || "",
    hotline: org.orgHotline || org.hotline || "",
    logo: org.orgLogo || org.logo,
    address: org.orgAddress || org.address || "",
    registrationNumber:
      org.orgRegistrationNumber || org.registrationNumber || "",
    status: org.status || "ACTIVE",
    adminName: org.fullName || org.adminName,
    adminEmail: org.email || org.adminEmail || "",
    active: org.status === "ACTIVE" || org.active !== false,
    deleted: org.status === "DELETED" || org.deleted === true,
    createdAt: org.createdAt || new Date().toISOString(),
    updatedAt: org.updatedAt || new Date().toISOString(),
  };

  return jsonResponse(mappedOrganization, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  return withErrorBoundary(() => handlePUT(request, { params }), {
    context: "api/business-admin/organizations/[userId]/status/route.ts/PUT",
  });
}
