export type DocumentItem = {
  id: string;
  title: string;
  orgName: string;
  domain: string;
  specialization: string;
  uploader: string;
  publicYear: number;
};

export type SearchFilters = {
  organization?: string | null;
  domain?: string | null;
  specialization?: string | null;
  publicYear?: number | null;
};

export type SearchMeta = {
  organizations: string[];
  domains: string[];
  specializations: string[];
  years: number[];
  specializationsByDomain?: Record<string, string[]>;
};
