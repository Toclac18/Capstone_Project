// Re-export from service layer
export {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  approveTag,
} from "@/services/manageTagService";

export type {
  Tag,
  TagQueryParams,
  TagResponse,
  CreateTagRequest,
  UpdateTagRequest,
  TagStatus,
} from "@/types/document-tag";

