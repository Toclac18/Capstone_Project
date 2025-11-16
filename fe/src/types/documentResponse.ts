export type DocumentItem = {
  id: string;
  title: string;
  orgName: string;
  domain: string;
  specialization: string;
  uploader: string;
  publicYear: number;
  isPremium: boolean;
  points?: number | null;
  description: string;
  summarizations: {
    short: string;
    medium: string;
    detailed: string;
  };
  upvote_counts: number;
  downvote_counts: number;
  thumbnail: string;
};

export type SearchFilters = {
  q?: string | null;
  organization?: string | null;
  domain?: string | null;
  domains?: string[] | null;
  specialization?: string | null;
  publicYear?: number | null;
  publicYearFrom?: number | null;
  publicYearTo?: number | null;
  isPremium?: boolean | null;
  pointsFrom?: number | null;
  pointsTo?: number | null;
};

export type SearchMeta = {
  organizations: string[];
  domains: string[];
  specializations: string[];
  years: number[];
  specializationsByDomain?: Record<string, string[]>;
  pointsRange?: { min: number; max: number };
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};
