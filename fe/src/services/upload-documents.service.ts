import { apiClient } from "./http";

export type DocumentType = {
  id: string;
  name: string;
};

export type Domain = {
  id: string;
  name: string;
  code: number;
};

export type Tag = {
  id: string;
  name: string;
};

export type Specialization = {
  id: string;
  name: string;
  code: number;
  domainId: string;
};

export type UploadDocumentRequest = {
  file: File;
  title: string;
  description: string;
  visibility: "PUBLIC" | "INTERNAL" | "PRIVATE";
  typeId: string;
  domainIds: string[];
  specializationIds: string[];
  tagIds: string[];
  newTags?: string[];
};

export type UploadDocumentResponse = {
  id: string;
  message: string;
};

/**
 * Get list of document types
 */
export async function getDocumentTypes(): Promise<DocumentType[]> {
  const res = await apiClient.get<DocumentType[]>("/reader/documents/types");
  return res.data;
}

/**
 * Get list of domains
 */
export async function getDomains(): Promise<Domain[]> {
  const res = await apiClient.get<Domain[]>("/reader/documents/domains");
  return res.data;
}

/**
 * Get list of tags (no search param)
 */
export async function getTags(): Promise<Tag[]> {
  const res = await apiClient.get<Tag[]>("/reader/documents/tags");
  return res.data;
}

/**
 * Get list of specializations by domain IDs
 */
export async function getSpecializations(domainIds: string[]): Promise<Specialization[]> {
  const res = await apiClient.get<Specialization[]>("/reader/documents/specializations", {params: {domainIds: domainIds.join(",")}});
  return res.data;
}

/**
 * Upload a document
 */
export async function uploadDocument(
  data: UploadDocumentRequest
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", data.file);
  formData.append("title", data.title);
  formData.append("description", data.description);
  formData.append("visibility", data.visibility);
  formData.append("typeId", data.typeId);
  formData.append("domainIds", "1");
  data.specializationIds.forEach((id) => {
    formData.append("specializationIds", id);
  });
  data.tagIds.forEach((id) => {
    formData.append("tagIds", id);
  });
  if (data.newTags && data.newTags.length > 0) {
    data.newTags.forEach((tag) => {
      formData.append("newTags", tag);
    });
  }

  const res = await apiClient.post<UploadDocumentResponse>(
    "/reader/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": undefined, // Let axios set it automatically
      },
    }
  );
  return res.data;
}

