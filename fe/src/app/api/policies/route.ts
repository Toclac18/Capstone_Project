// app/api/policies/route.ts
import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handleGET(_req: NextRequest): Promise<Response> {
  if (USE_MOCK) {
    // Mock response - return empty array for now
    return jsonResponse({ data: [] }, { status: 200, mode: "mock" });
  }

  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/policies`, {
      method: "GET",
      headers: fh,
      cache: "no-store",
    });

    if (!upstream.ok) {
      let errorData: any = {};
      try {
        const text = await upstream.text();
        errorData = text ? JSON.parse(text) : {};
      } catch {
        // Ignore parse errors
      }
      return jsonResponse(
        errorData?.data ?? errorData ?? { message: "Failed to fetch policies" },
        {
          status: upstream.status,
          mode: "real",
        },
      );
    }

    const raw = await upstream.json().catch(() => ({}));

    // Handle different response structures
    let policies: any[] = [];
    if (raw?.data) {
      if (Array.isArray(raw.data)) {
        policies = raw.data;
      } else if (raw.data?.data && Array.isArray(raw.data.data)) {
        policies = raw.data.data;
      } else if (raw.data?.success && Array.isArray(raw.data.data)) {
        policies = raw.data.data;
      }
    } else if (Array.isArray(raw)) {
      policies = raw;
    } else if (raw?.success && Array.isArray(raw.data)) {
      policies = raw.data;
    }

    return jsonResponse(
      { data: policies },
      {
        status: upstream.status,
        mode: "real",
      },
    );
  } catch (e: any) {
    return jsonResponse(
      { message: "Policies fetch failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/policies/route.ts/GET",
  });

async function handlePOST(req: NextRequest): Promise<Response> {
  const body = await req.json().catch(() => null);

  if (!body) {
    return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
  }

  if (USE_MOCK) {
    return jsonResponse(
      { data: { id: "mock-id", ...body, isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } },
      { status: 201, mode: "mock" },
    );
  }

  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/policies`, {
      method: "POST",
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
      { message: "Policy creation failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/policies/route.ts/POST",
  });
