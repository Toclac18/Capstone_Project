import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { proxyJsonResponse } from "@/server/response";

async function handleGET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = await getAuthHeader("reports");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const url = `${BE_BASE}/api/reports/${id}`;
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
  }

  return proxyJsonResponse(upstream, { mode: "real" });
}

async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = await getAuthHeader("reports");

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  const body = await request.json();

  const url = `${BE_BASE}/api/reports/${id}`;
  console.log(`[reports] Calling backend PUT: ${url}`);

  const upstream = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const errorClone = upstream.clone();
    const errorText = await errorClone.text();
    console.error(`[reports] Backend error (${upstream.status}):`, errorText);
  }

  return proxyJsonResponse(upstream, { mode: "real" });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withErrorBoundary(() => handleGET(request, context), {
    context: "api/business-admin/reports/[id]/route.ts/GET",
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return withErrorBoundary(() => handlePUT(request, context), {
    context: "api/business-admin/reports/[id]/route.ts/PUT",
  });
}
