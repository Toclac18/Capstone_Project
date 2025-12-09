// app/api/policies/active/route.ts
import { NextRequest } from "next/server";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handleGET(_req: NextRequest): Promise<Response> {
  if (USE_MOCK) {
    return jsonResponse(
      { error: "No active policy found" },
      { status: 404, mode: "mock" },
    );
  }

  try {
    // This endpoint is PUBLIC - no auth required
    const upstream = await fetch(`${BE_BASE}/api/policies/active`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const raw = await upstream.json().catch(() => ({}));
    return jsonResponse(raw?.data ?? raw, {
      status: upstream.status,
      mode: "real",
    });
  } catch (e: any) {
    return jsonResponse(
      { message: "Active policy fetch failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/policies/active/route.ts/GET",
  });

