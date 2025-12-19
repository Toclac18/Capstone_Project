// src/app/api/org-admin/readers/[enrollmentId]/re-invite/route.ts
import { BE_BASE } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { getAuthHeader } from "@/server/auth";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ enrollmentId: string }> };

async function handlePOST(
  _request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  const { enrollmentId } = await context.params;

  // Build upstream URL
  const upstreamUrl = `${BE_BASE}/api/organization/members/${enrollmentId}/re-invite`;

  // Get auth header
  const authHeader = await getAuthHeader();
  const headers = new Headers();
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }
  headers.set("Content-Type", "application/json");

  // Call backend
  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text || upstream.statusText, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "text/plain",
      },
    });
  }

  // Return success response
  return new Response(null, {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

export const POST = (
  ...args: Parameters<typeof handlePOST>
) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/org-admin/readers/[enrollmentId]/re-invite/route.ts/POST",
  });
