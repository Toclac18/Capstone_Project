import { mockSpecializationsDB } from "./dbMock";

/**
 * Mock API for manage-specializations domain.
 * Uses the global `fetch` interceptor technique.
 * Only available in dev mode.
 */
export function setupMockManageSpecializations() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockManageSpecializationsEnabled) return; // avoid double patch
  (globalThis as any)._mockManageSpecializationsEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    // Handle GET /api/business-admin/specializations
    if (
      url.includes("/api/business-admin/specializations") &&
      !url.match(/\/api\/business-admin\/specializations\/[^/]+$/)
    ) {
      if (init?.method === "GET" || !init?.method) {
        const urlObj = new URL(url, "http://localhost");
        const domainId = urlObj.searchParams.get("domainId");

        if (!domainId) {
          return new Response(
            JSON.stringify({ message: "domainId is required" }),
            {
              status: 400,
              headers: { "content-type": "application/json" },
            },
          );
        }

        const params = {
          domainId,
          search: urlObj.searchParams.get("search") || undefined,
        };

        const specializations = mockSpecializationsDB.list(params);
        const total = specializations.length;

        return new Response(
          JSON.stringify({
            specializations,
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
          const created = mockSpecializationsDB.create(body);
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

    // Handle /api/business-admin/specializations/[id]
    const idMatch = url.match(
      /\/api\/business-admin\/specializations\/([^/]+)$/,
    );
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
          const updated = mockSpecializationsDB.update(id, body);
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
    }

    // fall through
    return originalFetch(input, init);
  };

  console.info("[MOCK] Manage Specializations API enabled (fetch intercepted)");
}
