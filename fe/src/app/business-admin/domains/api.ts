// Re-export from service layer
export {
  getDomains,
  createDomain,
  updateDomain,
} from "@/services/manageDomainService";

export type {
  Domain,
  DomainQueryParams,
  DomainResponse,
  CreateDomainRequest,
  UpdateDomainRequest,
} from "@/types/document-domain";

