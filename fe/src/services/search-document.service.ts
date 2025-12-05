// src/services/search-document.service.ts
import type {
  DocumentSearchItem,
  SearchFilters,
  SearchMeta,
  Paged,
} from "@/types/document-search";

const API_BASE = "/api";

/* ---------------------- RAW TYPES (BE response) ---------------------- */

type RawSearchDocSummarizations = {
  shortSummary: string | null;
  mediumSummary: string | null;
  detailedSummary: string | null;
};

type RawSearchDocOrganization = {
  id: string;
  name: string;
  logoUrl: string | null;
};

type RawSearchDocUploader = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
};

type RawSearchDoc = {
  id: string;
  title: string;
  description: string;
  isPremium: boolean;
  price: number;
  thumbnailUrl: string | null;
  createdAt: string;
  viewCount: number;
  upvoteCount: number;
  voteScore: number;
  docTypeName: string;
  specializationName: string;
  domainName: string;
  tagNames: string[];
  summarizations: RawSearchDocSummarizations | null;
  organization: RawSearchDocOrganization | null;
  uploader: RawSearchDocUploader;
};

type RawPageInfo = {
  page: number; // 0-based từ BE
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
};

type RawSearchResponse = {
  success: boolean;
  data: RawSearchDoc[];
  pageInfo: RawPageInfo;
  timestamp: string;
};

/* --------- RAW TYPE /search-meta --------- */

type RawSearchMetaData = {
  organizations: {
    id: string;
    name: string;
    logoUrl: string | null;
    docCount: number | null;
  }[];
  domains: {
    id: string;
    code: number;
    name: string;
    docCount: number | null;
  }[];
  specializations: {
    id: string;
    code: number;
    name: string;
    domainId: string;
    docCount: number | null;
  }[];
  docTypes: {
    id: string;
    code: number;
    name: string;
    docCount: number | null;
  }[];
  tags: {
    id: string;
    code: number;
    name: string;
    docCount: number | null;
  }[];
  years: number[];
  priceRange: {
    min: number;
    max: number;
  } | null;
};

type RawSearchMetaResponse = {
  success: boolean;
  data: RawSearchMetaData;
  timestamp: string;
};

/* ---------------------- Helpers ---------------------- */

// Map sort FE → sorts[] BE (DocumentSearchFilter.sorts)
function buildSorts(sort?: SearchFilters["sort"]): string[] | undefined {
  switch (sort) {
    case "newest":
      return ["createdAt,DESC"];
    case "oldest":
      return ["createdAt,ASC"];
    case "price_asc":
      return ["price,ASC"];
    case "price_desc":
      return ["price,DESC"];
    case "most_viewed":
      return ["viewCount,DESC"];
    case "relevance":
    default:
      // Relevance để BE tự xử lý, không ép sort cụ thể
      return undefined;
  }
}

// Map 1 RawSearchDoc → DocumentSearchItem dùng trên FE
function mapRawDocToDocumentSearchItem(d: RawSearchDoc): DocumentSearchItem {
  return {
    id: d.id,
    title: d.title,
    description: d.description,

    organizationId: d.organization?.id,
    organizationName: d.organization?.name ?? "",
    organizationLogoUrl: d.organization?.logoUrl ?? null,

    domainName: d.domainName,
    specializationName: d.specializationName,
    docTypeName: d.docTypeName,

    isPremium: d.isPremium,
    price: d.price,

    thumbnailUrl: d.thumbnailUrl ?? null,

    createdAt: d.createdAt,
    viewCount: d.viewCount,
    upvoteCount: d.upvoteCount,
    voteScore: d.voteScore,

    tagNames: d.tagNames ?? [],

    summarizations: d.summarizations
      ? {
          shortSummary: d.summarizations.shortSummary,
          mediumSummary: d.summarizations.mediumSummary,
          detailedSummary: d.summarizations.detailedSummary,
        }
      : null,

    uploader: {
      id: d.uploader.id,
      fullName: d.uploader.fullName,
      avatarUrl: d.uploader.avatarUrl ?? null,
    },
  };
}

// Build body DocumentSearchFilter gửi lên BE
function buildSearchBody(params: {
  filters: SearchFilters;
  page: number;
  perPage: number;
}): any {
  const { filters, page, perPage } = params;

  // FE 1-based → BE 0-based
  const safePage = Math.max(1, page || 1);
  const safePerPage = perPage || 20;

  const body: any = {
    page: safePage - 1,
    size: safePerPage,
  };

  const keyword = filters.q?.trim();
  if (keyword) {
    // DocumentSearchFilter.searchKeyword
    body.searchKeyword = keyword;
  }

  const arrOrUndefined = (ids?: string[]) =>
    ids && ids.length > 0 ? ids : undefined;

  // MULTI-SELECT FILTERS
  const organizationIds = arrOrUndefined(filters.organizationIds);
  if (organizationIds) body.organizationIds = organizationIds;

  const domainIds = arrOrUndefined(filters.domainIds);
  if (domainIds) body.domainIds = domainIds;

  const specializationIds = arrOrUndefined(filters.specializationIds);
  if (specializationIds) body.specializationIds = specializationIds;

  const docTypeIds = arrOrUndefined(filters.docTypeIds);
  if (docTypeIds) body.docTypeIds = docTypeIds;

  const tagIds = arrOrUndefined(filters.tagIds);
  if (tagIds) body.tagIds = tagIds;

  // YEAR
  if (filters.yearFrom !== undefined) {
    body.yearFrom = filters.yearFrom;
  }
  if (filters.yearTo !== undefined) {
    body.yearTo = filters.yearTo;
  }

  // PRICE
  if (filters.priceFrom !== undefined) {
    body.priceFrom = filters.priceFrom;
  }
  if (filters.priceTo !== undefined) {
    body.priceTo = filters.priceTo;
  }

  // PREMIUM FLAG
  if (filters.isPremium !== undefined) {
    body.isPremium = filters.isPremium;
  }

  // SORTS
  const sorts = buildSorts(filters.sort);
  if (sorts && sorts.length > 0) {
    body.sorts = sorts;
  }

  return body;
}

/* ---------------------- Public APIs ---------------------- */

// Gọi /api/search → proxy tới BE /search
export async function searchDocuments(args: {
  filters: SearchFilters;
  page: number;
  perPage: number;
}): Promise<Paged<DocumentSearchItem>> {
  const body = buildSearchBody(args);

  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to search documents: ${res.status}`);
  }

  const raw: RawSearchResponse = await res.json();
  const pageInfo = raw.pageInfo;

  const page = pageInfo ? pageInfo.page + 1 : args.page;
  const perPage = pageInfo ? pageInfo.size : args.perPage;

  return {
    items: (raw.data || []).map(mapRawDocToDocumentSearchItem),
    total: pageInfo.totalElements,
    page,
    perPage,
    pageCount: pageInfo.totalPages,
  };
}

// Gọi /api/search-meta → proxy tới BE /search-meta
export async function fetchSearchMeta(): Promise<SearchMeta> {
  const res = await fetch(`${API_BASE}/search-meta`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch search meta: ${res.status}`);
  }

  const json: RawSearchMetaResponse = await res.json();
  const d = json.data;

  const meta: SearchMeta = {
    organizations: (d.organizations || []).map((o) => ({
      id: o.id,
      name: o.name,
      logoUrl: o.logoUrl,
      docCount: o.docCount,
    })),
    domains: (d.domains || []).map((dom) => ({
      id: dom.id,
      code: dom.code,
      name: dom.name,
      docCount: dom.docCount,
    })),
    specializations: (d.specializations || []).map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      domainId: s.domainId,
      docCount: s.docCount,
    })),
    docTypes: (d.docTypes || []).map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      docCount: t.docCount,
    })),
    tags: (d.tags || []).map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      docCount: t.docCount,
    })),
    years: d.years ?? [],
    priceRange: d.priceRange
      ? { min: d.priceRange.min, max: d.priceRange.max }
      : null,
  };

  return meta;
}
