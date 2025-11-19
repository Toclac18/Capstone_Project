// Re-export from service layer
export {
  getTypes,
  createType,
  updateType,
} from "@/services/manageTypeService";

// Re-export types from document-type
export type {
  DocumentType as Type,
  TypeQueryParams,
  TypeResponse,
  CreateTypeRequest,
  UpdateTypeRequest,
} from "@/types/document-type";

