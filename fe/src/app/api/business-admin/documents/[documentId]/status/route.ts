import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePATCH(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const body = await request.json().catch(() => ({}));
  const status = body.status;

  if (USE_MOCK) {
    return jsonResponse({ message: "Document status updated successfully" }, {
      status: 200,
      mode: "mock",
    });
  }

  if (!status) {
    return jsonResponse({ error: "Status is required" }, {
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

  const url = `${BE_BASE}/api/admin/documents/${documentId}/status?status=${encodeURIComponent(status)}`;
  console.log(`[documents] Calling backend: ${url}`);

  // Send status in request body as per backend DTO
  const upstream = await fetch(`${BE_BASE}/api/admin/documents/${documentId}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  const responseData = await upstream.json().catch(() => ({}));
  
  return jsonResponse(responseData || { message: "Document status updated successfully" }, {
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
    context: "api/business-admin/documents/[documentId]/status/route.ts/PATCH",
  });
}

