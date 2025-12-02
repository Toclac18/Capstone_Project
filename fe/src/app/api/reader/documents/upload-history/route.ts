import { mockDocumentsDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";

// Helper functions
const isValidUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};


async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;
  const type = searchParams.get("type") || undefined;
  const domain = searchParams.get("domain") || undefined;
  const status = searchParams.get("status") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (USE_MOCK) {
    const result = mockDocumentsDB.getUploadHistory({
      search,
      dateFrom,
      dateTo,
      type,
      domain,
      status: status as "PENDING" | "APPROVED" | "REJECTED" | undefined,
      page,
      limit,
    });
    return jsonResponse(result, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const authHeader = await getAuthHeader();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (authHeader) headers.set("Authorization", authHeader);

  // Build query params - type and domain should be UUIDs from frontend
  const queryParams = new URLSearchParams();
  if (search) queryParams.append("searchKeyword", search);
  if (dateFrom) queryParams.append("dateFrom", dateFrom);
  if (dateTo) queryParams.append("dateTo", dateTo);
  if (type && isValidUUID(type)) queryParams.append("docTypeId", type);
  if (domain && isValidUUID(domain)) queryParams.append("domainId", domain);
  if (status) queryParams.append("status", status);
  queryParams.append("page", String(page - 1)); // Backend uses 0-indexed
  queryParams.append("size", String(limit));

  const url = `${BE_BASE}/api/documents/my-uploads?${queryParams.toString()}`;
  const upstream = await fetch(url, { method: "GET", headers, cache: "no-store" });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  try {
    const backendResponse = await upstream.json();
    const documents = Array.isArray(backendResponse.data) ? backendResponse.data : [];
    const pageInfo = backendResponse.pageInfo || {};
    
    const transformed = {
      documents: documents.map((doc: any) => ({
        id: doc.id,
        documentName: doc.title || "",
        uploadDate: doc.createdAt || new Date().toISOString(),
        type: doc.docTypeName || "",
        domain: doc.domainName || "",
        specialization: doc.specializationName || "",
        fileSize: 0,
        status: doc.status || "",
        canRequestReview: doc.status === "REJECTED" && !doc.redemptionCount,
      })),
      total: pageInfo.totalElements ?? documents.length,
      page: (pageInfo.page ?? 0) + 1,
      limit: pageInfo.size ?? limit,
      totalPages: pageInfo.totalPages ?? Math.ceil((pageInfo.totalElements ?? documents.length) / (pageInfo.size ?? limit)),
    };
    
    return jsonResponse(transformed, {
      status: 200,
      headers: { "content-type": "application/json", "x-mode": "real" },
    });
  } catch (error: any) {
    console.error("Error parsing upload history response:", error);
    return proxyJsonResponse(upstream, { mode: "real" });
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/reader/documents/upload-history/route.ts/GET",
  });
