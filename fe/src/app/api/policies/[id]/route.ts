// app/api/policies/[id]/route.ts
import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handleGET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (USE_MOCK) {
    return jsonResponse(
      { error: "Policy not found" },
      { status: 404, mode: "mock" },
    );
  }

  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/policies/${id}`, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    return jsonResponse(raw?.data ?? raw, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      { message: "Policy fetch failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/policies/[id]/route.ts/GET",
  });

async function handlePUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body) {
    return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
  }

  if (USE_MOCK) {
    return jsonResponse(
      { data: { id, ...body, updatedAt: new Date().toISOString() } },
      { status: 200, mode: "mock" },
    );
  }

  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/policies/${id}`, {
      method: "PUT",
      headers: fh,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    return jsonResponse(raw?.data ?? raw, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      { message: "Policy update failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/policies/[id]/route.ts/PUT",
  });

async function handleDELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (USE_MOCK) {
    return jsonResponse({}, { status: 204, mode: "mock" });
  }

  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/policies/${id}`, {
      method: "DELETE",
      headers: fh,
      cache: "no-store",
    });

    if (upstream.status === 204) {
      return jsonResponse({}, { status: 204, mode: "real" });
    }

    const raw = await upstream.json().catch(() => ({}));
    return jsonResponse(raw?.data ?? raw, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      { message: "Policy deletion failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const DELETE = (...args: Parameters<typeof handleDELETE>) =>
  withErrorBoundary(() => handleDELETE(...args), {
    context: "api/policies/[id]/route.ts/DELETE",
  });
