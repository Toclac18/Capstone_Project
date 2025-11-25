import { mockDomainsDB } from "./dbMock";

/**
 * Mock API for manage-domains domain.
 * Uses the global `fetch` interceptor technique.
 * Only available in dev mode.
 */
export function setupMockManageDomains() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockManageDomainsEnabled) return; // avoid double patch
  (globalThis as any)._mockManageDomainsEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    // Handle GET /api/business-admin/domains
    if (
      url.includes("/api/business-admin/domains") &&
      !url.match(/\/api\/business-admin\/domains\/[^/]+$/)
    ) {
      if (init?.method === "GET" || !init?.method) {
        const urlObj = new URL(url, "http://localhost");
        const params = {
          search: urlObj.searchParams.get("search") || undefined,
          dateFrom: urlObj.searchParams.get("dateFrom") || undefined,
          dateTo: urlObj.searchParams.get("dateTo") || undefined,
        };

        const domains = mockDomainsDB.list(params);
        const total = domains.length;

        return new Response(
          JSON.stringify({
            domains,
            total,
            page: 1,
            limit: 10,
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
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
          const created = mockDomainsDB.create(body);
          return new Response(JSON.stringify(created), {
            status: 201,
            headers: { "content-type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      }
    }

    // Handle /api/business-admin/domains/[id]
    const idMatch = url.match(/\/api\/business-admin\/domains\/([^/]+)$/);
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
          const updated = mockDomainsDB.update(id, body);
          return new Response(JSON.stringify(updated), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      }

      if (init?.method === "DELETE") {
        try {
          mockDomainsDB.delete(id);
          return new Response(
            JSON.stringify({ message: "Domain deleted successfully." }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          );
        } catch (error: any) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
      }
    }

    // fall through
    return originalFetch(input, init);
  };

  console.info("[MOCK] Manage Domains API enabled (fetch intercepted)");
}
