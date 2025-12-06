import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getOrganizations } from "@/mock/business-admin-organizations";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "100";
  const search = searchParams.get("search") || undefined;

  if (USE_MOCK) {
    const response = getOrganizations({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
    return jsonResponse(response, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const authHeader = await getAuthHeader("organizations");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  // Backend endpoint for listing organizations (GET method)
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(parseInt(page) - 1)); // Backend uses 0-based page
  queryParams.append("size", limit);
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";
  queryParams.append("sort", sort);
  queryParams.append("order", order);
  if (search) {
    queryParams.append("search", search);
  }
  const status = searchParams.get("status");
  if (status) {
    // Backend uses UserStatus enum: PENDING_EMAIL_VERIFY, PENDING_APPROVE, ACTIVE, INACTIVE, REJECTED, DELETED
    // Map frontend status to backend enum if needed
    const statusMap: Record<string, string> = {
      PENDING_VERIFICATION: "PENDING_EMAIL_VERIFY",
      ACTIVE: "ACTIVE",
      INACTIVE: "INACTIVE",
      DEACTIVE: "INACTIVE",
      DELETED: "DELETED",
      REJECTED: "REJECTED",
      PENDING_APPROVE: "PENDING_APPROVE",
    };
    const backendStatus = statusMap[status.toUpperCase()] || status;
    queryParams.append("status", backendStatus);
  }

  const url = `${BE_BASE}/api/admin/organizations?${queryParams.toString()}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    // Clone response to read error text without consuming the original body
    const errorClone = upstream.clone();
    const errorText = await errorClone.text();
    console.error(
      `[organizations] Backend error (${upstream.status}):`,
      errorText,
    );
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json();
  // Backend returns Page<AdminOrganizationResponse>
  // Convert to OrganizationResponse format
  const pageData = responseData?.content || responseData?.data?.content || [];
  const total = responseData?.totalElements || responseData?.total || 0;

  // Map AdminOrganizationResponse to Organization format
  // Note: AdminOrganizationResponse now includes organizationId
  const mappedOrganizations = (pageData || []).map((org: any) => ({
    id: org.organizationId || org.userId || org.id, // Use organizationId if available, fallback to userId
    userId: org.userId || org.id, // Keep userId for reference
    organizationId: org.organizationId || org.userId || org.id, // Add organizationId for statistics API
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
  }));

  return jsonResponse(
    {
      organizations: mappedOrganizations,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    },
    {
      status: upstream.status,
      headers: {
        "content-type": "application/json",
        "x-mode": "real",
      },
    },
  );
}

export async function GET(request: Request) {
  return withErrorBoundary(() => handleGET(request), {
    context: "api/business-admin/organizations/route.ts/GET",
  });
}
