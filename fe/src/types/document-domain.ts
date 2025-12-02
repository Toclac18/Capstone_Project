export interface Domain {
  id: string;
  name: string;
  createdDate: string;
}

export interface DomainQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "name" | "createdDate";
  sortOrder?: "asc" | "desc";
}

export interface DomainResponse {
  domains: Domain[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDomainRequest {
  code: number;
  name: string;
}

export interface UpdateDomainRequest {
  name?: string;
}

