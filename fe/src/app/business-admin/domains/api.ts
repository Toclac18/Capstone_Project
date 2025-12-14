// Re-export from service layer
export {
  getDomains,
  createDomain,
  updateDomain,
} from "@/services/manage-domain.service";

export type {
  Domain,
  DomainQueryParams,
  DomainResponse,
  CreateDomainRequest,
  UpdateDomainRequest,
} from "@/types/document-domain";
