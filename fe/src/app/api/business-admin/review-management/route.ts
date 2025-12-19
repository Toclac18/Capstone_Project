import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "10";
  const tab = searchParams.get("tab") || undefined;
  const reviewerId = searchParams.get("reviewerId") || undefined;
  const domain = searchParams.get("domain") || undefined;
  const search = searchParams.get("search") || undefined;
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortOrder = searchParams.get("sortOrder") || undefined;

  if (USE_MOCK) {
    return jsonResponse(
      {
        data: [],
        pageInfo: {
          page: parseInt(page),
          size: parseInt(size),
          totalElements: 0,
          totalPages: 0,
        },
      },
      {
        status: 200,
        mode: "mock",
      },
    );
  }

  const authHeader = await getAuthHeader("documents");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const query = new URLSearchParams();
  query.set("page", page);
  query.set("size", size);
  if (tab) query.set("tab", tab);
  if (reviewerId) query.set("reviewerId", reviewerId);
  if (domain) query.set("domain", domain);
  if (search) query.set("search", search);
  if (sortBy) query.set("sortBy", sortBy);
  if (sortOrder) query.set("sortOrder", sortOrder);

  const url = `${BE_BASE}/api/admin/review-management${
    query.toString() ? `?${query.toString()}` : ""
  }`;
  console.log(`[review-management] Calling backend: ${url}`);

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json().catch(() => ({}));

  // Backend returns PagedResponse<ReviewManagementItem>:
  // { success, data, pageInfo }
  const mapped = {
    items: Array.isArray(responseData?.data) ? responseData.data : [],
    pageInfo: responseData?.pageInfo || {
      page: parseInt(page),
      size: parseInt(size),
      totalElements: 0,
      totalPages: 0,
    },
  };

  return jsonResponse(mapped, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET(request: Request) {
  return withErrorBoundary(() => handleGET(request), {
    context: "api/business-admin/review-management/route.ts/GET",
  });
}


