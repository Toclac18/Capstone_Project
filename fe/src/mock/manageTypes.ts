import { mockTypesDB } from "./db";

/**
 * Mock API for manage-types domain.
 * Uses the global `fetch` interceptor technique.
 * Only available in dev mode.
 */
export function setupMockManageTypes() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockManageTypesEnabled) return; // avoid double patch
  (globalThis as any)._mockManageTypesEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    
    // Handle GET /api/business-admin/types
    if (url.includes("/api/business-admin/types") && !url.match(/\/api\/business-admin\/types\/[^/]+$/)) {
      if (init?.method === "GET" || !init?.method) {
        const urlObj = new URL(url, "http://localhost");
        const params = {
          search: urlObj.searchParams.get("search") || undefined,
          dateFrom: urlObj.searchParams.get("dateFrom") || undefined,
          dateTo: urlObj.searchParams.get("dateTo") || undefined,
        };

        const types = mockTypesDB.list(params);
        const total = types.length;

        return new Response(
          JSON.stringify({
            types,
            total,
            page: 1,
            limit: 10,
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        );
      }

      if (init?.method === "POST") {
        let body: any = {};

        if (init.body) {
          try {
            body = JSON.parse(init.body as string);
          } catch {
            body = {};
          }
        }

        try {
          const created = mockTypesDB.create(body);
          return new Response(JSON.stringify(created), {
            status: 201,
            headers: { "content-type": "application/json" },
          });
        } catch (error: any) {
          return new Response(
            JSON.stringify({ message: error.message }),
            {
              status: 400,
              headers: { "content-type": "application/json" },
            }
          );
        }
      }
    }

    // Handle /api/business-admin/types/[id]
    const idMatch = url.match(/\/api\/business-admin\/types\/([^/]+)$/);
    if (idMatch) {
      const id = idMatch[1];

      if (init?.method === "PUT") {
        let body: any = {};

        if (init.body) {
          try {
            body = JSON.parse(init.body as string);
          } catch {
            body = {};
          }
        }

        try {
          const updated = mockTypesDB.update(id, body);
          return new Response(JSON.stringify(updated), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error: any) {
          return new Response(
            JSON.stringify({ message: error.message }),
            {
              status: 400,
              headers: { "content-type": "application/json" },
            }
          );
        }
      }
    }

    // fall through
    return originalFetch(input, init);
  };

  console.info("[MOCK] Manage Types API enabled (fetch intercepted)");
}

