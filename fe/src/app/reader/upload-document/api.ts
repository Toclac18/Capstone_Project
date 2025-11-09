import {
  getDocumentTypes as getDocumentTypesService,
  getDomains as getDomainsService,
  getTags as getTagsService,
  getSpecializations as getSpecializationsService,
  uploadDocument as uploadDocumentService,
  type DocumentType,
  type Domain,
  type Tag,
  type Specialization,
  type UploadDocumentRequest,
  type UploadDocumentResponse,
} from "@/services/uploadDocuments";

export type {
  DocumentType,
  Domain,
  Tag,
  Specialization,
  UploadDocumentRequest,
  UploadDocumentResponse,
};

export async function fetchDocumentTypes(): Promise<DocumentType[]> {
  return getDocumentTypesService();
}

export async function fetchDomains(): Promise<Domain[]> {
  return getDomainsService();
}

export async function fetchTags(): Promise<Tag[]> {
  return getTagsService();
}

export async function fetchSpecializations(domainIds: string[]): Promise<Specialization[]> {
  return getSpecializationsService(domainIds);
}

export async function uploadDocument(
  data: UploadDocumentRequest
): Promise<UploadDocumentResponse> {
  return uploadDocumentService(data);
}

