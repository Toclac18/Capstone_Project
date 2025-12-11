// app/api/notifications/unread-count/route.ts

import { mockNotificationDB } from "@/mock/db.mock";
import { BE_BASE, USE_MOCK } from "@/server/config";
import { getAuthHeader } from "@/server/auth";
import { jsonResponse, proxyJsonResponse } from "@/server/response";
import { withErrorBoundary } from "@/server/withErrorBoundary";

async function handleGET(): Promise<Response> {
  if (USE_MOCK) {
    const unreadCount = mockNotificationDB.getUnreadCount();
    return jsonResponse({ count: unreadCount }, { status: 200, mode: "mock" });
  }

  const authHeader = await getAuthHeader("notifications");

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);

  const upstream = await fetch(`${BE_BASE}/api/notifications/unread-count`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return proxyJsonResponse(upstream, { mode: "real" });
  }

  // Parse backend response - may be wrapped in { success, data, timestamp } or direct { count }
  const backendResponse = await upstream.json();

  // Extract count from response
  const count = backendResponse?.data?.count ?? backendResponse?.count ?? 0;

  return jsonResponse({ count }, { status: upstream.status, mode: "real" });
}

export const GET = (...args: Parameters<typeof handleGET>) =>
  withErrorBoundary(() => handleGET(...args), {
    context: "api/notifications/unread-count/route.ts/GET",
  });
