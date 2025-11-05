import { mockOrganizationAdminDB } from "./db";

/**
 * Mock API for manage-organization domain.
 * Uses the global `fetch` interceptor technique.
 * Only available in dev mode.
 */
export function setupMockManageOrganization() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockManageOrganizationEnabled) return; // avoid double patch
  (globalThis as any)._mockManageOrganizationEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    
    if (url.includes("/api/organization-admin/manage-organization")) {
      if (init?.method === "GET") {
      const orgInfo = mockOrganizationAdminDB.get();
      return new Response(JSON.stringify(orgInfo), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
      }
      
      if (init?.method === "PUT") {
        let body: any = {};
        
        if (init.body instanceof FormData) {
          // Handle FormData
          init.body.forEach((value, key) => {
            if (key === "certificateUpload" && value instanceof File) {
              // For mock, we'll just store the file name
              body[key] = value.name;
            } else {
              body[key] = value.toString();
            }
          });
        } else if (init.body) {
          // Handle JSON
          try {
            body = JSON.parse(init.body as string);
          } catch {
            body = {};
          }
        }
        
        const updated = mockOrganizationAdminDB.update(body);
        return new Response(JSON.stringify(updated), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      
      if (init?.method === "DELETE") {
        mockOrganizationAdminDB.delete();
        return new Response(
          JSON.stringify({ message: "Organization deleted successfully" }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        );
      }
    }

    // fall through
    return originalFetch(input, init);
  };

  console.info("[MOCK] Manage Organization API enabled (fetch intercepted)");
}

