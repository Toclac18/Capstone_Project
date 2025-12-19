// src/types/document-search.ts

// Tóm tắt nhiều mức độ cho document
export type DocumentSearchSummarizations = {
  shortSummary?: string | null;
  mediumSummary?: string | null;
  detailedSummary?: string | null;
};

// Item dùng để render trên UI search
export type DocumentSearchItem = {
  id: string;
  title: string;
  description: string;

  // Tổ chức
  organizationId?: string;
  organizationName: string;
  organizationLogoUrl?: string | null;

  // Domain / specialization / doc type
  domainName: string;
  specializationName: string;
  docTypeName: string;

  // Premium & giá
  isPremium: boolean;
  price: number;

  // Thumbnail
  thumbnailUrl?: string | null;

  // Thống kê
  createdAt: string;
  viewCount: number;
  upvoteCount: number;
  voteScore: number;

  // Tag dạng tên (từ BE trả ra)
  tagNames: string[];

  // Tóm tắt
  summarizations?: DocumentSearchSummarizations | null;

  // Người upload
  uploader: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
};

// Các option sort dùng ở FE
export type SearchSortOption =
  | "relevance"
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "most_viewed";

// Bộ filter FE đang giữ trong context SearchProvider
export type SearchFilters = {
  // Từ khóa text search
  q?: string;

  // Nhiều ID cho các filter (ưu tiên array, đúng với BE DocumentSearchFilter)
  organizationIds?: string[];
  domainIds?: string[];
  specializationIds?: string[];
  docTypeIds?: string[];
  tagIds?: string[];

  // Năm
  yearFrom?: number;
  yearTo?: number;

  // Premium & giá
  isPremium?: boolean;
  priceFrom?: number;
  priceTo?: number;

  // Sort
  sort?: SearchSortOption;
};

// --------- Meta dùng cho FilterModal (/search-meta) ----------

export type SearchMetaOrganization = {
  id: string;
  name: string;
  logoUrl?: string | null;
  docCount?: number | null;
};

export type SearchMetaDomain = {
  id: string;
  code: number;
  name: string;
  docCount?: number | null;
};

export type SearchMetaSpecialization = {
  id: string;
  code: number;
  name: string;
  domainId: string;
  docCount?: number | null;
};

export type SearchMetaDocType = {
  id: string;
  code: number;
  name: string;
  docCount?: number | null;
};

export type SearchMetaTag = {
  id: string;
  code: number;
  name: string;
  docCount?: number | null;
};

export type SearchMeta = {
  organizations: SearchMetaOrganization[];
  domains: SearchMetaDomain[];
  specializations: SearchMetaSpecialization[];
  docTypes: SearchMetaDocType[];
  tags: SearchMetaTag[];
  years: number[];
  priceRange: {
    min: number;
    max: number;
  } | null;
  /** Organization IDs mà user đã join (chỉ có khi authenticated) */
  joinedOrganizationIds?: string[] | null;
};

// Kết quả phân trang dùng chung
export type Paged<T> = {
  items: T[];
  total: number;
  page: number; // 1-based cho FE
  perPage: number;
  pageCount: number;
};
