// app/api/notifications/route.ts
import { headers } from "next/headers";
import { mockNotificationDB } from "@/mock/db";
import { BE_BASE, USE_MOCK } from "@/server/config";

export async function GET() {
  if (USE_MOCK) {
    const notifications = mockNotificationDB.list();
    const unreadCount = mockNotificationDB.getUnreadCount();
    const response = {
      notifications,
      total: notifications.length,
      unreadCount,
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-mode": "mock",
      },
    });
  }

  const h = await headers();
  const authHeader = h.get("authorization") || "";
  const cookieHeader = h.get("cookie") || "";

  const fh = new Headers({ "Content-Type": "application/json" });
  if (authHeader) fh.set("Authorization", authHeader);
  if (cookieHeader) fh.set("Cookie", cookieHeader);

  const upstream = await fetch(`${BE_BASE}/api/notifications`, {
    method: "GET",
    headers: fh,
    cache: "no-store",
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "x-mode": "real",
    },
  });
}