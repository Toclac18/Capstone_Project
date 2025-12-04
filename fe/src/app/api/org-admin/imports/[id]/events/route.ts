// src/app/api/org-admin/imports/[id]/events/route.ts
import { NextRequest } from "next/server";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";

function createSseResponse(
  write: (
    send: (event: string, data: unknown) => void,
    close: () => void,
  ) => void,
): Response {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        const chunk = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      const close = () => controller.close();

      write(send, close);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    },
  });
}

async function handleGET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  // Await params để lấy id
  const { id } = await ctx.params;

  // ---------------- MOCK MODE ----------------
  if (USE_MOCK) {
    return createSseResponse((send, close) => {
      // Gửi 1 event progress + 1 event complete cho màn mock
      send("progress", {
        batchId: id,
        processed: 2,
        total: 2,
        success: 2,
        failed: 0,
        percent: 100,
      });

      send("complete", { batchId: id });
      close();
    });
  }

  // ---------------- REAL BE MODE ----------------
  const auth = await getAuthHeader();
  const beEventsUrl = `${BE_BASE}/api/organization/members/import-batches/${encodeURIComponent(
    id,
  )}/enrollments`;

  try {
    const res = await fetch(beEventsUrl, {
      headers: auth ? { Authorization: auth } : {},
    });

    if (!res.ok || !res.body) {
      return createSseResponse((send, close) => {
        send("complete", { batchId: id });
        close();
      });
    }

    // Proxy raw SSE từ BE
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    // Nếu có lỗi khi gọi BE -> báo complete cho FE để dừng chờ
    return createSseResponse((send, close) => {
      send("complete", { batchId: id, error: true });
      close();
    });
  }
}

// Update Type ở export function để khớp với handleGET
export const GET = (
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) =>
  withErrorBoundary(() => handleGET(req, ctx), {
    context: "api/org-admin/imports/[id]/events/route.ts/GET",
  });
