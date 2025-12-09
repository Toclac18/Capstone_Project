import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePATCH(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;

  if (USE_MOCK) {
    return jsonResponse({ message: "Document deactivated successfully" }, {
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

  const url = `${BE_BASE}/api/admin/documents/${documentId}/deactivate`;
  console.log(`[documents] Calling backend: ${url}`);

  const upstream = await fetch(url, {
    method: "PATCH",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json().catch(() => ({}));
  
  return jsonResponse(responseData || { message: "Document deactivated successfully" }, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
      "x-mode": "real",
    },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  return withErrorBoundary(() => handlePATCH(request, context), {
    context: "api/business-admin/documents/[documentId]/deactivate/route.ts/PATCH",
  });
}

