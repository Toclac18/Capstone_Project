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

    // Upload history endpoint
    if (url.includes("/api/reader/documents/upload-history") && init?.method === "GET") {
      const urlObj = new URL(url, "http://localhost");
      const dateFrom = urlObj.searchParams.get("dateFrom") || undefined;
      const dateTo = urlObj.searchParams.get("dateTo") || undefined;
      const type = urlObj.searchParams.get("type") || undefined;
      const domain = urlObj.searchParams.get("domain") || undefined;
      const status = urlObj.searchParams.get("status") || undefined;
      const page = urlObj.searchParams.get("page")
        ? parseInt(urlObj.searchParams.get("page")!, 10)
        : 1;
      const limit = urlObj.searchParams.get("limit")
        ? parseInt(urlObj.searchParams.get("limit")!, 10)
        : 10;

      const result = mockDocumentsDB.getUploadHistory({
        dateFrom,
        dateTo,
        type,
        domain,
        status: status as "PENDING" | "APPROVED" | "REJECTED" | undefined,
        page,
        limit,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Re-review endpoint
    if (url.match(/\/api\/reader\/documents\/.+\/re-review$/) && init?.method === "POST") {
      const documentId = url.split("/").slice(-2, -1)[0]; // Extract ID from URL
      const body = init.body ? JSON.parse(init.body as string) : {};
      const reason = body.reason?.trim() || "";

      // Validate reason
      if (!reason) {
        return new Response(
          JSON.stringify({
            error: "Reason is required",
          }),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          }
        );
      }

      if (reason.length < 10) {
        return new Response(
          JSON.stringify({
            error: "Reason must be at least 10 characters",
          }),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          }
        );
      }

      // Use mockDocumentsDB.requestReReview
      const result = mockDocumentsDB.requestReReview(documentId, reason);

      if (result.error) {
        return new Response(
          JSON.stringify({
            error: result.error,
          }),
          {
            status: result.status || 400,
            headers: { "content-type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          message: result.message || "Your request has been submitted and is under review.",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      );
    }

    return originalFetch(input, init);
  };

  console.info("[MOCK] Documents API enabled (fetch intercepted)");
}

