import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse } from "@/server/response";

async function handleGET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const documentId = params.id;
  const authHeader = await getAuthHeader();

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const url = `${BE_BASE}/api/documents/${documentId}/violations`;

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withErrorBoundary(() => handleGET(request, context), {
    context: "api/reader/documents/[id]/violations/route.ts/GET",
  });
}
