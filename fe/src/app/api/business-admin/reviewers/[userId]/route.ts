import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  if (USE_MOCK) {
    return jsonResponse(
      {
        id: userId,
        email: "mock@example.com",
        fullName: "Mock Reviewer",
        status: "ACTIVE",
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

  const authHeader = await getAuthHeader("reviewers");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const url = `${BE_BASE}/api/admin/reviewers/${userId}`;

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json();
  // Backend returns AdminReviewerResponse directly
  const user = responseData?.data || responseData;

  // Map AdminReviewerResponse to User format
  const mappedUser = {
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
  };

  return jsonResponse(mappedUser, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  return withErrorBoundary(() => handleGET(request, { params }), {
    context: "api/business-admin/reviewers/[userId]/route.ts/GET",
  });
}
