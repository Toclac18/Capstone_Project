/**
 * Simple mock login/logout routes.
 * Simulates token storage in localStorage (not secure, only for dev).
 */
export function setupMockAuth() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockAuthEnabled) return;
  (globalThis as any)._mockAuthEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.endsWith("/api/auth/login") && init?.method === "POST") {
      const token = "mock-jwt-token-" + Math.random().toString(36).slice(2);
      localStorage.setItem("access_token", token);
      return new Response(JSON.stringify({ ok: true, token }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (url.endsWith("/api/auth/logout") && init?.method === "POST") {
      localStorage.removeItem("access_token");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return originalFetch(input, init);
  };

  console.info("[MOCK] Auth API enabled");
}
