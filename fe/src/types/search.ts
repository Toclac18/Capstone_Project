export type DocumentItem = {
  id: string;
  title: string;
  orgName: string;
  domain: string;
  specialization: string;
  uploader: string;
  publicYear: number;
  isPremium: boolean;
  points?: number;
};

export type SearchFilters = {
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
