import { mockDB, type ContactAdminPayload } from "./db";

/**
 * Mock API for contact-admin domain.
 * Uses the global `fetch` interceptor technique.
 * Only available in dev mode.
 */
export function setupMockContactAdmin() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockContactAdminEnabled) return; // avoid double patch
  (globalThis as any)._mockContactAdminEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.endsWith("/api/contact-admin")) {
      if (init?.method === "GET") {
        const items = mockDB.list();
        return new Response(JSON.stringify({ items, total: items.length }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (init?.method === "POST") {
        try {
          const text = init.body ? (init.body as string) : "{}";
          const body: ContactAdminPayload = JSON.parse(text);

          // Validation
          const required = [
            "name",
            "email",
            "category",
            "urgency",
            "subject",
            "message",
          ];
          for (const field of required) {
            if (!(body as any)[field]) {
              return new Response(
                JSON.stringify({ error: `Missing field: ${field}` }),
                {
                  status: 400,
                  headers: { "content-type": "application/json" },
                },
              );
            }
          }

          const ticket = mockDB.insert(body);
          const resp = {
            ticketId: ticket.ticketId,
            ticketCode: ticket.ticketCode,
            status: ticket.status,
            message: "Your message has been received (mock).",
          };
          return new Response(JSON.stringify(resp), {
            status: 201,
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      }
    }
    // fall through
    return originalFetch(input, init);
  };

  console.info("[MOCK] Contact Admin API enabled (fetch intercepted)");
}
