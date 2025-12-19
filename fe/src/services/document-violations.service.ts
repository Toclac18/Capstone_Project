import { apiClient } from "./http";

export type ViolationType = "text" | "image";

export type DocumentViolation = {
  id: string;
  type: ViolationType;
  snippet: string;
  page: number;
  prediction: string;
  confidence: number;
  createdAt: string;
};

export type DocumentViolationsResponse = {
  violations: DocumentViolation[];
};

/**
 * Get violations for a document
 */
export async function getDocumentViolations(
  documentId: string
): Promise<DocumentViolation[]> {
  const res = await apiClient.get<{ data: DocumentViolation[] }>(
    `/reader/documents/${documentId}/violations`
  );
  // Backend returns { success, data: [...], timestamp }
  return Array.isArray(res.data) ? res.data : (res.data?.data || []);
}
