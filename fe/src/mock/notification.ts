import { mockNotificationDB } from "./db";

/**
 * Mock API for notification domain.
 * Uses the global `fetch` interceptor technique.
 * Only available in dev mode.
 */
export function setupMockNotification() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockNotificationEnabled) return; // avoid double patch
  (globalThis as any)._mockNotificationEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    
    if (url.endsWith("/api/notifications") && init?.method === "GET") {
      const notifications = mockNotificationDB.list();
      const unreadCount = mockNotificationDB.getUnreadCount();
      return new Response(
        JSON.stringify({
          notifications,
          total: notifications.length,
          unreadCount,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (url.includes("/api/notifications/") && url.endsWith("/read") && init?.method === "POST") {
      const match = url.match(/\/api\/notifications\/(.+)\/read$/);
      if (match) {
        const id = match[1];
        mockNotificationDB.markAsRead(id);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // fall through
    return originalFetch(input, init);
  };

  console.info("[MOCK] Notification API enabled (fetch intercepted)");
}

