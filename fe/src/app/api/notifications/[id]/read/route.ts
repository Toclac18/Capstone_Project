// app/api/notifications/[id]/read/route.ts
import { mockNotificationDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";
import { proxyJsonResponse, jsonResponse } from "@/server/response";

async function handlePATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (USE_MOCK) {
    mockNotificationDB.markAsRead(id);
    return jsonResponse(
      null,
      {
        status: 204,
        mode: "mock",
      },
    );
  }

  const authHeader = await getAuthHeader("notifications");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const PATCH = (...args: Parameters<typeof handlePATCH>) =>
  withErrorBoundary(() => handlePATCH(...args), {
    context: "api/notifications/[id]/read/route.ts/PATCH",
  });
