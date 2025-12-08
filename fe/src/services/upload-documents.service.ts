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
  code?: number; // Tag code (Long) for backend
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
  tagIds: string[]; // Tag UUIDs - will be converted to tagCodes using tags list
  tags?: Tag[]; // Optional: tags list to map tagIds to tagCodes
  newTags?: string[];
  organizationId?: string;
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
 * Backend expects:
 * - @RequestPart(name = "info") UploadDocumentInfoRequest (JSON)
 * - @RequestPart(name = "file") MultipartFile (File)
 */
export async function uploadDocument(
  data: UploadDocumentRequest
): Promise<UploadDocumentResponse> {
  // Build info object matching UploadDocumentInfoRequest
  // Note: Backend expects specializationId (single UUID), not specializationIds (array)
  // Frontend sends specializationIds array, we take the first one
  if (!data.specializationIds || data.specializationIds.length === 0) {
    throw new Error("At least one specialization is required");
  }
  
  // Convert tagIds (UUIDs) to tagCodes (Long) using tags list
  // If tags list is provided, use it to map; otherwise fetch tags
  let tagCodes: number[] = [];
  if (data.tagIds && data.tagIds.length > 0) {
    if (data.tags && data.tags.length > 0) {
      // Map tagIds to tagCodes using provided tags list
      tagCodes = data.tagIds
        .map(tagId => {
          const tag = data.tags!.find(t => t.id === tagId);
          return tag?.code;
        })
        .filter((code): code is number => code !== undefined && code !== null);
    } else {
      // If tags not provided, fetch them to get codes
      const allTags = await getTags();
      tagCodes = data.tagIds
        .map(tagId => {
          const tag = allTags.find(t => t.id === tagId);
          return tag?.code;
        })
        .filter((code): code is number => code !== undefined && code !== null);
    }
  }
  
  // Build info JSON object matching UploadDocumentInfoRequest
  const info = {
    title: data.title,
    description: data.description,
    visibility: data.visibility,
    isPremium: false, // Default to false, can be made configurable later
    docTypeId: data.typeId,
    specializationId: data.specializationIds[0], // Backend expects single specializationId
    organizationId: data.organizationId || null,
    tagCodes: tagCodes,
    newTags: data.newTags || [],
  };

  // Create FormData with info as JSON string and file
  const formData = new FormData();
  formData.append("info", JSON.stringify(info));
  formData.append("file", data.file);

  const res = await apiClient.post<UploadDocumentResponse>(
    "/reader/documents/upload",
    formData,
    {
      headers: {
        "Content-Type": undefined, // Let axios set it automatically for multipart/form-data
      },
    }
  );
  return res.data;
}

