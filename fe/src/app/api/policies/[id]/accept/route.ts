// app/api/policies/[id]/accept/route.ts
import { NextRequest } from "next/server";
import { acceptPolicy } from "@/mock/policies";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handlePOST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  if (USE_MOCK) {
    // Mock: use a default userId (in real app, decode JWT from auth header)
    const userId = "user-1";
    const success = acceptPolicy(id, userId);
    if (!success) {
      return jsonResponse(
        { error: "Policy not found" },
        {
          status: 404,
          mode: "mock",
        },
      );
    }
    return jsonResponse(
      { message: "Policy accepted successfully" },
      { status: 200, mode: "mock" },
    );
  }

  try {
    const authHeader = await getAuthHeader();
    const fh = new Headers({ "Content-Type": "application/json" });
    if (authHeader) fh.set("Authorization", authHeader);

    const upstream = await fetch(`${BE_BASE}/api/policies/${id}/accept`, {
      method: "POST",
      headers: fh,
      cache: "no-store",
    });

    // Backend returns 204 NO_CONTENT (no body) for successful acceptance
    if (upstream.status === 204) {
      return new Response(null, {
        status: 204,
        statusText: "No Content",
      });
    }

    // For other status codes, try to parse JSON
    if (!upstream.ok) {
      const errorText = await upstream
        .text()
        .catch(() => "Policy acceptance failed");
      return jsonResponse(
        { error: errorText },
        { status: upstream.status, mode: "real" },
      );
    }

    // If status is 200, parse JSON response
    const raw = await upstream.json().catch(() => ({}));
    return jsonResponse(
      raw?.data ?? raw ?? { message: "Policy accepted successfully" },
      {
        status: upstream.status,
        mode: "real",
      },
    );
  } catch (e: any) {
    return jsonResponse(
      { message: "Policy acceptance failed", error: String(e) },
      { status: 502 },
    );
  }
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/policies/[id]/accept/route.ts/POST",
  });
