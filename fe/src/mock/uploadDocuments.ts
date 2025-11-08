import { mockDocumentsDB } from "./db";

/**
 * Mock API for documents upload and related endpoints.
 * Uses the global `fetch` interceptor technique.
 * Only available in dev mode.
 */
export function setupMockDocuments() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockDocumentsEnabled) return;
  (globalThis as any)._mockDocumentsEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    // Document types endpoint
    if (url.includes("/api/reader/documents/types") && init?.method === "GET") {
      const types = mockDocumentsDB.getTypes();
      return new Response(JSON.stringify(types), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Domains endpoint
    if (url.includes("/api/reader/documents/domains") && init?.method === "GET") {
      const domains = mockDocumentsDB.getDomains();
      return new Response(JSON.stringify(domains), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Tags endpoint
    if (url.includes("/api/reader/documents/tags") && init?.method === "GET") {
      const tags = mockDocumentsDB.getTags();
      return new Response(JSON.stringify(tags), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Specializations endpoint
    if (url.includes("/api/reader/documents/specializations") && init?.method === "GET") {
      const urlObj = new URL(url, "http://localhost");
      const domainIdsParam = urlObj.searchParams.get("domainIds");
      const domainIds = domainIdsParam ? domainIdsParam.split(",").filter(Boolean) : [];
      const specializations = mockDocumentsDB.getSpecializations(domainIds);
      return new Response(JSON.stringify(specializations), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Upload document endpoint
    if (url.includes("/api/reader/documents/upload") && init?.method === "POST") {
      if (init.body instanceof FormData) {
        const file = init.body.get("file") as File;
        
        if (!file) {
          return new Response(
            JSON.stringify({ error: "File is required" }),
            {
              status: 400,
              headers: { "content-type": "application/json" },
            }
          );
        }

        // Mock successful upload
        return new Response(
          JSON.stringify({
            id: "doc-" + Date.now(),
            message: "Your document has been uploaded successfully. (mock)",
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    return originalFetch(input, init);
  };

  console.info("[MOCK] Documents API enabled (fetch intercepted)");
}

