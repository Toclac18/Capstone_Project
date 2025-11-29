// app/api/notifications/read-all/route.ts

import { mockNotificationDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/hooks/withErrorBoundary";

async function handlePATCH(): Promise<Response> {
  if (USE_MOCK) {
    const count = mockNotificationDB.markAllAsRead();
    return jsonResponse(
      { count },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("notifications");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/notifications/read-all`, {
    method: "PATCH",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const PATCH = (...args: Parameters<typeof handlePATCH>) =>
  withErrorBoundary(() => handlePATCH(...args), {
    context: "api/notifications/read-all/route.ts/PATCH",
  });

