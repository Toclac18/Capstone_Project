// Re-export from service layer
export {
  getSpecializations,
  createSpecialization,
  updateSpecialization,
} from "@/services/manageSpecializationService";

// Re-export types from document-specialization
export type {
  Specialization,
  SpecializationQueryParams,
  SpecializationResponse,
  CreateSpecializationRequest,
  UpdateSpecializationRequest,
} from "@/types/document-specialization";

