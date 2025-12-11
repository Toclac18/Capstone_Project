import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(request: Request) {
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

  const url = `${BE_BASE}/api/admin/review-requests?page=${page}&size=${size}`;
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
  
  // Backend returns PagedResponse with structure:
  // { success: true, data: [...], pageInfo: { page, size, totalElements, totalPages } }
  // Map to frontend expected structure: { content: [...], totalElements, totalPages, number, size }
  let mappedData = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: parseInt(page),
    size: parseInt(size),
  };
  
  if (responseData?.data && Array.isArray(responseData.data)) {
    mappedData.content = responseData.data;
    if (responseData.pageInfo) {
      mappedData.totalElements = responseData.pageInfo.totalElements || 0;
      mappedData.totalPages = responseData.pageInfo.totalPages || 0;
      mappedData.number = responseData.pageInfo.page || parseInt(page);
      mappedData.size = responseData.pageInfo.size || parseInt(size);
    }
  } else {
    console.warn("[review-requests] Unexpected response structure:", responseData);
  }
  
  return jsonResponse(mappedData, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET(request: Request) {
  return withErrorBoundary(() => handleGET(request), {
    context: "api/business-admin/review-requests/route.ts/GET",
  });
}

