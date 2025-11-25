// Re-export from service layer
export {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  approveTag,
} from "@/services/manage-tag.service";

export type {
  Tag,
  TagQueryParams,
  TagResponse,
  CreateTagRequest,
  UpdateTagRequest,
  TagStatus,
} from "@/types/document-tag";
