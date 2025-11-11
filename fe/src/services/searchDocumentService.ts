import type {
  SearchFilters,
  DocumentItem,
  SearchMeta,
  Paged,
} from "@/types/search";

const BASE = "/api";

export async function fetchDocuments(
  filters?: SearchFilters,
  page: number = 1,
  perPage: number = 10,
): Promise<Paged<DocumentItem>> {
  const params = new URLSearchParams();

  // pagination
  params.set("page", String(Math.max(1, page)));
  params.set("perPage", String(Math.max(1, perPage)));

  if (filters) {
    if (filters.q) params.set("q", filters.q);

    if (filters.organization)
      params.set("organization", String(filters.organization));

    // legacy + multi domains
    if (filters.domain) params.set("domain", String(filters.domain));
    if (filters.domains?.length)
      for (const d of filters.domains) params.append("domains", d);

    if (filters.specialization)
      params.set("specialization", String(filters.specialization));

    // years
    if (filters.publicYearFrom != null)
      params.set("publicYearFrom", String(filters.publicYearFrom));
    if (filters.publicYearTo != null)
      params.set("publicYearTo", String(filters.publicYearTo));
    if (filters.publicYear != null)
      params.set("publicYear", String(filters.publicYear)); // legacy

    // premium + points range
    if (filters.isPremium === true) params.set("isPremium", "true");
    if (filters.pointsFrom != null)
      params.set("pointsFrom", String(filters.pointsFrom));
    if (filters.pointsTo != null)
      params.set("pointsTo", String(filters.pointsTo));
  }

  const url = `${BASE}/search?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch documents: ${res.status}`);
  return res.json();
}

export async function fetchMeta(): Promise<SearchMeta> {
  const res = await fetch(`${BASE}/search-meta`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.status}`);
  return res.json();
}
