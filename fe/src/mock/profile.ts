import { mockProfileDB, type ProfileData } from "./db";

/**
 * Mock API for profile domain.
 * Uses mockProfileDB from db.ts.
 * Similar to contact-admin mock implementation.
 */
export function setupMockProfile() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockProfileEnabled) return; // avoid double patch
  (globalThis as any)._mockProfileEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    // GET /api/profile/get
    if (url.includes("/api/profile/get") && (!init?.method || init?.method === "GET")) {
      const u = new URL(url, globalThis.location?.origin || "http://localhost");
      const role = u.searchParams.get("role") || "READER";
      const profile = mockProfileDB.get(role);
      // Backend response format: { data: ProfileResponse }
      return new Response(JSON.stringify({ data: profile }), {
        status: 200,
        headers: { "content-type": "application/json", "x-mock": "profile" },
      });
    }

    // PUT /api/profile/update
    if (url.includes("/api/profile/update") && init?.method === "PUT") {
      try {
        const text = init.body ? (init.body as string) : "{}";
        const body: Partial<ProfileData> = JSON.parse(text);
        const updated = mockProfileDB.update(body);
        // Backend response format: { data: ProfileResponse }
        return new Response(JSON.stringify({ data: updated }), {
          status: 200,
          headers: { "content-type": "application/json", "x-mock": "profile" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // POST /api/profile/change-email
    if (url.includes("/api/profile/change-email") && init?.method === "POST") {
      try {
        const text = init.body ? (init.body as string) : "{}";
        const body: { newEmail: string; password: string } = JSON.parse(text);
        mockProfileDB.update({ email: body.newEmail });
        return new Response(
          JSON.stringify({ message: "Email changed successfully. (mock)" }),
          {
            status: 200,
            headers: { "content-type": "application/json", "x-mock": "profile" },
          }
        );
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // POST /api/profile/change-password
    if (url.includes("/api/profile/change-password") && init?.method === "POST") {
      try {
        const text = init.body ? (init.body as string) : "{}";
        // Validate JSON format (body intentionally unused in mock)
        JSON.parse(text);
        return new Response(
          JSON.stringify({ message: "Password changed successfully. (mock)" }),
          {
            status: 200,
            headers: { "content-type": "application/json", "x-mock": "profile" },
          }
        );
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // POST /api/profile/delete-account
    if (url.includes("/api/profile/delete-account") && init?.method === "POST") {
      try {
        const text = init.body ? (init.body as string) : "{}";
        // Validate JSON format (body intentionally unused in mock)
        JSON.parse(text);
        mockProfileDB.clear();
        return new Response(
          JSON.stringify({ message: "Account deleted successfully. (mock)" }),
          {
            status: 200,
            headers: { "content-type": "application/json", "x-mock": "profile" },
          }
        );
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // fall through
    return originalFetch(input, init);
  };

  console.info("[MOCK] Profile API enabled (fetch intercepted)");
}
