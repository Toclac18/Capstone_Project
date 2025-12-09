import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";
import { mockGetDocDetail } from "@/mock/docs-detail.mock";

async function handleGET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;

  if (USE_MOCK) {
    const result = mockGetDocDetail(documentId);
    if (!result) {
      return jsonResponse({ error: "Document not found" }, {
        status: 404,
        mode: "mock",
      });
    }
    return jsonResponse(result, { status: 200, mode: "mock" });
  }

  const authHeader = await getAuthHeader("documents");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const url = `${BE_BASE}/api/admin/documents/${documentId}`;
  console.log(`[documents] Calling backend: ${url}`);

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json();
  // Backend returns ApiResponse<DocumentDetailResponse>
  let documentData = responseData?.data || responseData;

  // Map backend response to frontend format
  if (documentData && typeof documentData === 'object') {
    documentData = {
      ...documentData,
      // Add isPublic for backward compatibility (computed from visibility)
      isPublic: documentData.visibility === "PUBLIC",
      // Map docType to type (for backward compatibility)
      type: documentData.docType ? {
        id: documentData.docType.id,
        name: documentData.docType.name,
        description: documentData.docType.description,
      } : null,
      // Map specialization (singular) to specializations (array) for backward compatibility
      specializations: documentData.specialization ? [{
        id: documentData.specialization.id,
        name: documentData.specialization.name,
        code: null, // Not available in backend response
        domain: documentData.specialization.domain,
      }] : [],
      // Map commentCount, saveCount, reportCount from adminInfo if available
      commentCount: documentData.adminInfo?.commentCount || 0,
      saveCount: documentData.adminInfo?.saveCount || 0,
      reportCount: documentData.adminInfo?.reportCount || 0,
      purchaseCount: documentData.adminInfo?.purchaseCount || null,
    };
  }

  return jsonResponse(documentData, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  return withErrorBoundary(() => handleGET(request, context), {
    context: "api/business-admin/documents/[documentId]/route.ts/GET",
  });
}

