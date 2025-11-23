// app/api/org-admin/imports/[id]/events/route.ts

import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { BE_BASE } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

export const runtime = "nodejs";

/**
 * Proxies Server-Sent Events (SSE) from the backend:
 *   BE_BASE/api/org-admin/imports/{id}/events
 */
async function handleGET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;

  if (!id) {
    return new Response("Missing import id", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const incomingHeaders = await headers();
  const authHeader = await getAuthHeader("org-admin-imports-events");

  const upstreamHeaders = new Headers();
  // SSE expectations
  upstreamHeaders.set("Accept", "text/event-stream");
  upstreamHeaders.set("Cache-Control", "no-cache");
  upstreamHeaders.set("Connection", "keep-alive");

  if (authHeader) {
    upstreamHeaders.set("Authorization", authHeader);
  }

  const clientIP = incomingHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  if (clientIP) {
    upstreamHeaders.set("X-Forwarded-For", clientIP);
  }

  const upstreamUrl = `${BE_BASE}/api/org-admin/imports/${encodeURIComponent(
    id,
  )}/events`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: upstreamHeaders,
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      const message =
        text || "Upstream service is unavailable or stream failed.";

      console.error(
        "[org-admin imports events] SSE upstream error:",
        upstream.status,
        message,
      );

      return new Response(message, {
        status: upstream.status || 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/event-stream");
    responseHeaders.set("Cache-Control", "no-cache");
    responseHeaders.set("Connection", "keep-alive");
    // Avoid buffering for proxies like Nginx
    responseHeaders.set("X-Accel-Buffering", "no");

    // Pass through the upstream SSE stream directly
    return new Response(upstream.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(
      "[org-admin imports events] Error fetching upstream SSE:",
      error,
    );
    return new Response("Upstream service is unavailable or stream failed.", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/org-admin/imports/[id]/events/route.ts/GET",
  });
