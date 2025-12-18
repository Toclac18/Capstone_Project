import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handleGET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "0";
  const size = searchParams.get("size") || "10";
  const status = searchParams.get("status") || undefined;
  const reason = searchParams.get("reason") || undefined;
  const documentId = searchParams.get("documentId") || undefined;

  const authHeader = await getAuthHeader("reports");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  // Build query params for backend
  const queryParams = new URLSearchParams();
  queryParams.append("page", page);
  queryParams.append("size", size);
  if (status) queryParams.append("status", status);
  if (reason) queryParams.append("reason", reason);
  if (documentId) queryParams.append("documentId", documentId);

  const url = `${BE_BASE}/api/reports?${queryParams.toString()}`;
  console.log(`[reports] Calling backend: ${url}`);

  const upstream = await fetch(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const errorClone = upstream.clone();
    const errorText = await errorClone.text();
    console.error(`[reports] Backend error (${upstream.status}):`, errorText);
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  return proxyJsonResponse(upstream, { mode: "real" });
}

export async function GET(request: Request) {
  return withErrorBoundary(() => handleGET(request), {
    context: "api/business-admin/reports/route.ts/GET",
  });
}
