import {
  getLibrary as getLibraryService,
  updateDocument as updateDocumentService,
  deleteDocument as deleteDocumentService,
  type LibraryDocument,
  type LibraryResponse,
  type LibraryQueryParams,
  type UpdateDocumentRequest,
  type UpdateDocumentResponse,
  type DeleteDocumentResponse,
} from "@/services/library";

export type {
  LibraryDocument,
  LibraryResponse,
  LibraryQueryParams,
  UpdateDocumentRequest,
  UpdateDocumentResponse,
  DeleteDocumentResponse,
};

export async function fetchLibrary(
  params?: LibraryQueryParams
): Promise<LibraryResponse> {
  return getLibraryService(params);
}

export async function updateLibraryDocument(
  documentId: string,
  data: UpdateDocumentRequest
): Promise<UpdateDocumentResponse> {
  return updateDocumentService(documentId, data);
}

export async function deleteLibraryDocument(
  documentId: string
): Promise<DeleteDocumentResponse> {
  return deleteDocumentService(documentId);
}

