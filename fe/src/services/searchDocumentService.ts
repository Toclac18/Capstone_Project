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

    // legacy single domain (giữ tương thích)
    if (filters.domain) params.set("domain", String(filters.domain));

    // multi domains: append nhiều lần
    if (filters.domains?.length) {
      for (const d of filters.domains) params.append("domains", d);
    }

    if (filters.specialization)
      params.set("specialization", String(filters.specialization));

    // year range
    if (filters.publicYearFrom != null)
      params.set("publicYearFrom", String(filters.publicYearFrom));
    if (filters.publicYearTo != null)
      params.set("publicYearTo", String(filters.publicYearTo));

    // premium + points range
    if (filters.isPremium === true) params.set("isPremium", "true");
    if (filters.pointsFrom != null)
      params.set("pointsFrom", String(filters.pointsFrom));
    if (filters.pointsTo != null)
      params.set("pointsTo", String(filters.pointsTo));

    // legacy publicYear (1 giá trị) – vẫn chấp nhận nếu BE còn dùng
    if (filters.publicYear != null)
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
