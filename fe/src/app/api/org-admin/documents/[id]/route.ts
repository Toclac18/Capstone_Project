// src/app/api/org-admin/documents/[id]/route.ts
import { BE_BASE } from "@/server/config";
import { withErrorBoundary } from "@/server/withErrorBoundary";
import { jsonResponse } from "@/server/response";
import { getAuthHeader } from "@/server/auth";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

async function handlePUT(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { id } = await context.params;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (!action || !["activate", "deactivate", "release"].includes(action)) {
    return jsonResponse(
      { error: "Invalid action. Must be: activate, deactivate, or release" },
      { status: 400 }
    );
  }

  const upstreamUrl = `${BE_BASE}/api/organization/documents/${encodeURIComponent(id)}/${action}`;

  const authHeader = await getAuthHeader();
  const fh = new Headers();
  if (authHeader) {
    fh.set("Authorization", authHeader);
  }
  fh.set("Content-Type", "application/json");

  const upstream = await fetch(upstreamUrl, {
    method: "PUT",
    headers: fh,
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

  const payload = await upstream.json();

  return jsonResponse(payload, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export const PUT = (...args: Parameters<typeof handlePUT>) =>
  withErrorBoundary(() => handlePUT(...args), {
    context: "api/org-admin/documents/[id]/route.ts/PUT",
  });
