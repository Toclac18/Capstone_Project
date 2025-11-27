// app/api/notifications/[id]/read/route.ts
import { headers } from "next/headers";
import { mockNotificationDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePOST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (USE_MOCK) {
    mockNotificationDB.markAsRead(id);
    return jsonResponse(
      { success: true },
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-mode": "mock",
        },
      },
    );
  }

  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);

  const upstream = await fetch(`${BE_BASE}/api/notifications/${id}/read`, {
    method: "POST",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const POST = (...args: Parameters<typeof handlePOST>) =>
  withErrorBoundary(() => handlePOST(...args), {
    context: "api/notifications/[id]/read/route.ts/POST",
  });
