import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

export const runtime = "nodejs";

async function handleGET(_req: NextRequest): Promise<Response> {
  if (USE_MOCK) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(": connected\n\n"));
        
        const interval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          } catch {
            clearInterval(interval);
          }
        }, 30000);

        _req.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const incomingHeaders = await headers();
  const authHeader = await getAuthHeader("notifications-events");

  const upstreamHeaders = new Headers();
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

  const upstreamUrl = `${BE_BASE}/api/notifications/events`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: upstreamHeaders,
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      const message =
        text || "Upstream service is unavailable or stream failed.";

      console.error(
        "[notifications events] SSE upstream error:",
        upstream.status,
        message,
      );

      return new Response(message, {
        status: upstream.status || 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (!upstream.body) {
      console.error("[notifications events] Upstream response has no body");
      return new Response("Upstream service returned empty response", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/event-stream");
    responseHeaders.set("Cache-Control", "no-cache, no-transform");
    responseHeaders.set("Connection", "keep-alive");
    responseHeaders.set("X-Accel-Buffering", "no");
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "content-encoding") {
        responseHeaders.set(key, value);
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            controller.enqueue(value);
          }
        } catch (error: any) {
          if (error?.cause?.code === 'UND_ERR_SOCKET' || 
              error?.message?.includes('terminated') ||
              error?.message?.includes('other side closed')) {
            try {
              controller.close();
            } catch (e) {
              // Ignore errors when closing
            }
          } else {
            console.error("[notifications events] Error reading upstream stream:", error);
            try {
              controller.error(error);
            } catch (e) {
              // Ignore errors when erroring
            }
          }
        } finally {
          try {
            reader.releaseLock();
          } catch (e) {
            // Ignore errors when releasing lock
          }
        }
      },
      
      cancel() {
        upstream.body?.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(
      "[notifications events] Error fetching upstream SSE:",
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
    context: "api/notifications/events/route.ts/GET",
  });

