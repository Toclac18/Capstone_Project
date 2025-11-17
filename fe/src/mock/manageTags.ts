import { mockTagsDB } from "./db";

/**
 * Mock API for manage-tags domain.
 * Uses the global `fetch` interceptor technique.
 * Only available in dev mode.
 */
export function setupMockManageTags() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockManageTagsEnabled) return; // avoid double patch
  (globalThis as any)._mockManageTagsEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    
    // Handle GET /api/business-admin/tags
    if (url.includes("/api/business-admin/tags") && !url.match(/\/api\/business-admin\/tags\/[^/]+$/)) {
      if (init?.method === "GET" || !init?.method) {
        const urlObj = new URL(url, "http://localhost");
        const params = {
          search: urlObj.searchParams.get("search") || undefined,
          status: (urlObj.searchParams.get("status") as "ACTIVE" | "INACTIVE" | "PENDING" | null) || undefined,
          dateFrom: urlObj.searchParams.get("dateFrom") || undefined,
          dateTo: urlObj.searchParams.get("dateTo") || undefined,
        };

        const tags = mockTagsDB.list(params);
        const total = tags.length;

        return new Response(
          JSON.stringify({
            tags,
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
          const created = mockTagsDB.create(body);
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

    // Handle /api/business-admin/tags/[id]
    const idMatch = url.match(/\/api\/business-admin\/tags\/([^/]+)$/);
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
          const updated = mockTagsDB.update(id, body);
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

      if (init?.method === "DELETE") {
        try {
          mockTagsDB.delete(id);
          return new Response(
            JSON.stringify({ message: "Tag deleted successfully." }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            }
          );
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

      if (init?.method === "POST") {
        try {
          const approved = mockTagsDB.approve(id);
          return new Response(JSON.stringify(approved), {
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

  console.info("[MOCK] Manage Tags API enabled (fetch intercepted)");
}

