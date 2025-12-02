import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getUsers as mockGetUsers } from "@/mock/business-admin-users";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "20";
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";

  if (USE_MOCK) {
    const response = mockGetUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
    });
    return jsonResponse(response, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const authHeader = await getAuthHeader("reviewers");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  // Backend endpoint: GET /api/admin/reviewers
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(parseInt(page) - 1)); // Backend uses 0-based page
  queryParams.append("size", limit);
  queryParams.append("sort", sort);
  queryParams.append("order", order);
  if (search) {
    queryParams.append("search", search);
  }
  if (status) {
    // Backend enum values: PENDING_EMAIL_VERIFY, PENDING_APPROVE, ACTIVE, INACTIVE, REJECTED, DELETED
    // Frontend already uses correct values, just pass through
    queryParams.append("status", status);
  }

  const url = `${BE_BASE}/api/admin/reviewers?${queryParams.toString()}`;
  console.log(`[reviewers] Calling backend: ${url}`);

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    // Clone response to read error text without consuming the original body
    const errorClone = upstream.clone();
    const errorText = await errorClone.text();
    console.error(`[reviewers] Backend error (${upstream.status}):`, errorText);
    console.error(`[reviewers] Request URL: ${url}`);
    console.error(`[reviewers] Request headers:`, Object.fromEntries(headers.entries()));
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json();
  // Backend returns Page<AdminReviewerResponse>
  const pageData = responseData?.content || responseData?.data?.content || [];
  const total = responseData?.totalElements || responseData?.total || 0;

  // Map AdminReviewerResponse to User format
  const mappedUsers = (pageData || []).map((user: any) => ({
    id: user.userId || user.id,
    userId: user.userId || user.id,
    email: user.email || "",
    fullName: user.fullName || "",
    avatarUrl: user.avatarUrl || "",
    point: user.point || 0,
    status: user.status || "ACTIVE",
    dateOfBirth: user.dateOfBirth || null,
    ordid: user.ordid || null,
    educationLevel: user.educationLevel || null,
    organizationName: user.organizationName || null,
    organizationEmail: user.organizationEmail || null,
    credentialFileUrls: user.credentialFileUrls || [],
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString(),
  }));

  return jsonResponse(
    {
      users: mappedUsers,
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
    }
  );
}

export async function GET(request: Request) {
  return withErrorBoundary(() => handleGET(request), {
    context: "api/business-admin/reviewers/route.ts/GET",
  });
}

