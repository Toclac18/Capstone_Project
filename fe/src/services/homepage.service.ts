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

// Trending Document types
export type TrendingDocument = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  docType: string | null;
  specialization: string | null;
  viewCount: number;
  voteScore: number;
  engagementScore: number;
  createdAt: string;
  uploader: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

// Trending Reviewer types
export type TrendingReviewer = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  organizationName: string | null;
  totalReviewsSubmitted: number;
  approvalRate: number;
  performanceScore: number;
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

/**
 * Fetch trending documents (top 5)
 * GET /api/homepage/trending-documents
 */
export async function fetchTrendingDocuments(): Promise<TrendingDocument[]> {
  const res = await fetch("/api/homepage/trending-documents", {
    method: "GET",
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("Trending documents failed:", text);
    return [];
  }

  const json = JSON.parse(text);
  return Array.isArray(json?.documents) ? json.documents : [];
}

/**
 * Fetch trending reviewers (top 5)
 * GET /api/homepage/trending-reviewers?forceRefresh=true
 */
export async function fetchTrendingReviewers(forceRefresh: boolean = false): Promise<TrendingReviewer[]> {
  const url = forceRefresh 
    ? "/api/homepage/trending-reviewers?forceRefresh=true"
    : "/api/homepage/trending-reviewers";
    
  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("Trending reviewers failed:", text);
    return [];
  }

  const json = JSON.parse(text);
  return Array.isArray(json?.reviewers) ? json.reviewers : [];
}
