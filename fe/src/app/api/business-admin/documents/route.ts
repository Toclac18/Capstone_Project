import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getDocuments } from "@/mock/business-admin-documents";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "10";
  const title = searchParams.get("title") || undefined;
  const uploaderId = searchParams.get("uploaderId") || undefined;
  const organizationId = searchParams.get("organizationId") || undefined;
  const docTypeId = searchParams.get("docTypeId") || undefined;
  const specializationId = searchParams.get("specializationId") || undefined;
  const status = searchParams.get("status") || undefined;
  const visibility = searchParams.get("visibility") || undefined;
  const isPremium = searchParams.get("isPremium") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;

  if (USE_MOCK) {
    const response = getDocuments({
      page: parseInt(page) + 1, // Convert to 1-based for mock
      limit: parseInt(size),
      search: title,
      organizationId,
      typeId: docTypeId,
      isPremium: isPremium ? isPremium === "true" : undefined,
      isPublic: visibility ? visibility === "PUBLIC" : undefined,
    });
    return jsonResponse(response, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const authHeader = await getAuthHeader("documents");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  // Build query params for backend
  const queryParams = new URLSearchParams();
  queryParams.append("page", page); // Backend uses 0-based
  queryParams.append("size", size);
  if (title) {
    queryParams.append("title", title);
  }
  if (uploaderId) {
    queryParams.append("uploaderId", uploaderId);
  }
  if (organizationId) {
    queryParams.append("organizationId", organizationId);
  }
  if (docTypeId) {
    queryParams.append("docTypeId", docTypeId);
  }
  if (specializationId) {
    queryParams.append("specializationId", specializationId);
  }
  if (status) {
    queryParams.append("status", status);
  }
  if (visibility) {
    queryParams.append("visibility", visibility);
  }
  if (isPremium) {
    queryParams.append("isPremium", isPremium);
  }
  if (dateFrom) {
    queryParams.append("dateFrom", dateFrom);
  }
  if (dateTo) {
    queryParams.append("dateTo", dateTo);
  }
  // Sort parameters - Spring Data format: sort=fieldName,direction
  const sort = searchParams.get("sort");
  if (sort) {
    queryParams.append("sort", sort);
  }

  const url = `${BE_BASE}/api/admin/documents?${queryParams.toString()}`;
  console.log(`[documents] Calling backend: ${url}`);

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const errorClone = upstream.clone();
    const errorText = await errorClone.text();
    console.error(`[documents] Backend error (${upstream.status}):`, errorText);
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json();
  // Backend returns PagedResponse<AdminDocumentListResponse>
  // Structure: { success: true, message: "...", data: [...], pageInfo: { page, size, totalElements, ... } }
  const pageData = responseData?.data || [];
  const total = responseData?.pageInfo?.totalElements || 0;
  const currentPage = responseData?.pageInfo?.page || 0;
  const pageSize = responseData?.pageInfo?.size || parseInt(size);

  // Map AdminDocumentListResponse to DocumentListItem format
  const mappedDocuments = (pageData || []).map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    status: doc.status,
    visibility: doc.visibility,
    isPremium: doc.isPremium || false,
    price: doc.price,
    thumbnailUrl: doc.thumbnailUrl,
    viewCount: doc.viewCount || 0,
    upvoteCount: doc.upvoteCount || 0,
    voteScore: doc.voteScore || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    uploader: doc.uploader ? {
      id: doc.uploader.id,
      fullName: doc.uploader.fullName || "",
      email: doc.uploader.email || "",
      username: doc.uploader.fullName || "", // Fallback
      avatarUrl: doc.uploader.avatarUrl,
    } : null,
    organization: doc.organization ? {
      id: doc.organization.id,
      name: doc.organization.name || "",
      logo: doc.organization.logoUrl,
    } : null,
    docTypeName: doc.docTypeName || "",
    specializationName: doc.specializationName || "",
    // Additional linked information
    commentCount: doc.commentCount || 0,
    saveCount: doc.saveCount || 0,
    reportCount: doc.reportCount || 0,
    purchaseCount: doc.purchaseCount,
    reviewStatus: doc.reviewStatus,
    // For compatibility with old format
    type: {
      id: "",
      name: doc.docTypeName || "",
    },
    // Note: visibility is the correct field, isPublic is for backward compatibility only
    isPublic: doc.visibility === "PUBLIC",
    deleted: doc.status === "DELETED",
  }));

  return jsonResponse(
    {
      documents: mappedDocuments,
      total,
      page: currentPage + 1, // Convert to 1-based
      limit: pageSize,
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
    context: "api/business-admin/documents/route.ts/GET",
  });
}

