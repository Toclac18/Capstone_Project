import type { SearchFilters } from "@/types/search";
import type { DocumentItem, SearchMeta } from "@/types/search";

const BASE = "/api";

export async function fetchDocuments(
  filters?: SearchFilters,
): Promise<DocumentItem[]> {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.organization)
      params.set("organization", String(filters.organization));
    if (filters.domain) params.set("domain", String(filters.domain));
    if (filters.specialization)
      params.set("specialization", String(filters.specialization));
    if (filters.publicYear)
      params.set("publicYear", String(filters.publicYear));
  }
  const url = `${BASE}/search${params.toString() ? `?${params}` : ""}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  return res.json();
}

export async function fetchMeta(): Promise<SearchMeta> {
  const res = await fetch(`${BASE}/search-meta`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.status}`);
  return res.json();
}
