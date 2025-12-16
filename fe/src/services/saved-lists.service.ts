import { apiClient } from "./http";

export interface SavedList {
  id: string;
  name: string;
  docCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedListDetail extends SavedList {
  documents: SavedListDocument[];
}

export interface SavedListDocument {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt: string;
  docTypeName?: string;
  domainName?: string;
  viewCount?: number;
}

/**
 * Get all saved lists for the current user
 */
export async function getSavedLists(): Promise<SavedList[]> {
  const res = await apiClient.get("/save-lists");
  // Handle both array response and wrapped response
  const data = res.data;
  return Array.isArray(data) ? data : (data as any)?.data ?? [];
}

/**
 * Get saved list detail with documents
 */
export async function getSavedListDetail(id: string): Promise<SavedListDetail> {
  const res = await apiClient.get(`/save-lists/${id}`);
  // Handle wrapped response format
  const data = res.data;
  return (data as any)?.data ?? data;
}

/**
 * Create a new saved list
 */
export async function createSavedList(name: string, documentId?: string): Promise<SavedList> {
  const res = await apiClient.post<SavedList>("/save-lists", { name, documentId });
  return res.data;
}

/**
 * Update saved list name
 */
export async function updateSavedList(id: string, name: string): Promise<SavedList> {
  const res = await apiClient.put<SavedList>(`/save-lists/${id}`, { name });
  return res.data;
}

/**
 * Delete a saved list
 */
export async function deleteSavedList(id: string): Promise<void> {
  await apiClient.delete(`/save-lists/${id}`);
}

/**
 * Add document to saved list
 */
export async function addDocumentToSavedList(listId: string, documentId: string): Promise<SavedList> {
  const res = await apiClient.post<SavedList>(`/save-lists/${listId}/documents`, { documentId });
  return res.data;
}

/**
 * Remove document from saved list
 */
export async function removeDocumentFromSavedList(listId: string, documentId: string): Promise<void> {
  await apiClient.delete(`/save-lists/${listId}/documents/${documentId}`);
}
