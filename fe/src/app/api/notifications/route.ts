// app/api/notifications/route.ts

import { mockNotificationDB } from "@/mock/db";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handleGET(): Promise<Response> {
  if (USE_MOCK) {
    const notifications = mockNotificationDB.list();
    const unreadCount = mockNotificationDB.getUnreadCount();

    return jsonResponse(
      {
        notifications,
        total: notifications.length,
        unreadCount,
      },
      { status: 200, mode: "mock" },
    );
  }

  const authHeader = await getAuthHeader("notifications");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/notifications`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  return proxyJsonResponse(upstream, { mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/notifications/route.ts/GET",
  });
