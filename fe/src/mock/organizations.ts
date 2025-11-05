/**
 * Mock API for organizations list.
 * Intercepts GET /api/organizations and returns a deterministic dataset.
 */
export function setupMockOrganizations() {
  const originalFetch = globalThis.fetch;
  if ((globalThis as any)._mockOrganizationsEnabled) return;
  (globalThis as any)._mockOrganizationsEnabled = true;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.endsWith("/api/organizations") && (!init || init.method === "GET")) {
      const items = [
        {
          id: "org-1",
          name: "Tech Innovation Hub",
          type: "NON-PROFIT",
          joinDate: new Date(2024, 8, 10).toISOString(),
        },
        {
          id: "org-2",
          name: "Digital Solutions Inc",
          type: "COMPANY",
          joinDate: new Date(2025, 0, 3).toISOString(),
        },
      ];
      return new Response(JSON.stringify({ items, total: items.length }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Detail endpoint
    const match = url.match(/\/api\/organizations\/(.+)$/);
    if (match && (!init || init.method === "GET")) {
      const id = decodeURIComponent(match[1]);
      const base = {
        id,
        name: id === "org-2" ? "Digital Solutions Inc" : "Tech Innovation Hub",
        type: id === "org-2" ? "COMPANY" : "NON-PROFIT",
        joinDate: id === "org-2" ? new Date(2025, 0, 3).toISOString() : new Date(2024, 8, 10).toISOString(),
      };
      const detail = {
        ...base,
        description:
          id === "org-2"
            ? "A software company focusing on scalable web platforms."
            : "Community hub that supports innovation and R&D collaborations.",
        memberCount: id === "org-2" ? 120 : 48,
        myRole: "READER",
        website: id === "org-2" ? "https://digital.example.com" : "https://innovation.example.org",
        email: id === "org-2" ? "contact@digital.example.com" : "info@innovation.example.org",
        phone: "+1 (555) 010-2000",
        address: id === "org-2" ? "200 Market St, Springfield" : "100 Innovation Way, Metropolis",
      };
      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return originalFetch(input, init);
  };

  console.info("[MOCK] Organizations API enabled (fetch intercepted)");
}


