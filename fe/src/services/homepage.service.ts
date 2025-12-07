// src/services/homepage.service.ts
"use client";

export type HomepageSpecGroup = {
  name: string;
  items: any[];
};

export type HomepageSections = {
  continueReading: any[];
  topUpvoted: any[];
  specGroups: HomepageSpecGroup[];
};

/**
 * GET /api/homepage?mode=bulk
 * Trả về cấu trúc:
 * {
 *   continueReading: [...],
 *   topUpvoted: [...],
 *   specGroups: [{ name, items }]
 * }
 */
export async function fetchHomepageSections(): Promise<HomepageSections> {
  const res = await fetch("/api/homepage?mode=bulk", {
    method: "GET",
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("Homepage bulk failed:", text);
    return {
      continueReading: [],
      topUpvoted: [],
      specGroups: [],
    };
  }

  const json = JSON.parse(text);

  return {
    continueReading: Array.isArray(json?.continueReading)
      ? json.continueReading
      : [],

    topUpvoted: Array.isArray(json?.topUpvoted) ? json.topUpvoted : [],

    specGroups: Array.isArray(json?.specGroups) ? json.specGroups : [],
  };
}

/**
 * Paged Search Mode (SearchBar)
 * GET /api/homepage?mode=paged&page=1&pageSize=12&q=...
 */
export async function fetchHomepagePaged(params: {
  page: number;
  pageSize: number;
  q?: string;
}) {
  const qs = new URLSearchParams();

  qs.set("mode", "paged");
  qs.set("page", String(params.page));
  qs.set("pageSize", String(params.pageSize));

  if (params.q) qs.set("q", params.q);

  const res = await fetch(`/api/homepage?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("Homepage paged failed:", text);
    return {
      items: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  const json = JSON.parse(text);

  return {
    items: json.items ?? [],
    total: json.total ?? 0,
    page: json.page ?? params.page,
    pageSize: json.pageSize ?? params.pageSize,
  };
}
