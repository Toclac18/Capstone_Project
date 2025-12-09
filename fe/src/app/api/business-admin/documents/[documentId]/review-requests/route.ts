import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const body = await request.json().catch(() => ({}));

  if (USE_MOCK) {
    return jsonResponse({
      id: "mock-review-request-id",
      document: { id: documentId, title: "Mock Document" },
      reviewer: { userId: body.reviewerId, email: "reviewer@example.com", fullName: "Mock Reviewer" },
      status: "PENDING",
      responseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, {
      status: 201,
      mode: "mock",
    });
  }

  if (!body.reviewerId) {
    return jsonResponse({ error: "Reviewer ID is required" }, {
      status: 400,
      mode: "real",
    });
  }

  const authHeader = await getAuthHeader("documents");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const url = `${BE_BASE}/api/admin/documents/${documentId}/review-requests`;
  console.log(`[review-requests] Calling backend: ${url}`);

  const upstream = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      reviewerId: body.reviewerId,
      note: body.note || null,
      existingReviewRequestId: body.existingReviewRequestId || null,
    }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json().catch(() => ({}));
  const data = responseData?.data || responseData;
  
  return jsonResponse(data, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

async function handleGET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "10";

  if (USE_MOCK) {
    return jsonResponse({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: parseInt(page),
      size: parseInt(size),
    }, {
      status: 200,
      mode: "mock",
    });
  }

  const authHeader = await getAuthHeader("documents");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const url = `${BE_BASE}/api/admin/documents/${documentId}/review-requests?page=${page}&size=${size}`;
  console.log(`[review-requests] Calling backend: ${url}`);

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json().catch(() => ({}));
  const data = responseData?.content !== undefined ? responseData : responseData?.data || responseData;
  
  return jsonResponse(data, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  return withErrorBoundary(() => handlePOST(request, context), {
    context: "api/business-admin/documents/[documentId]/review-requests/route.ts/POST",
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  return withErrorBoundary(() => handleGET(request, context), {
    context: "api/business-admin/documents/[documentId]/review-requests/route.ts/GET",
  });
}

