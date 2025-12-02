// src/services/save-list.service.ts
import { apiClient } from "./http";
import type { SaveList, SaveListDetail } from "@/types/saveList";

/**
 * Lấy tất cả SaveList của user hiện tại.
 * BFF (/api/save-lists) đã unwrap .data từ BE, nên FE nhận thẳng mảng SaveList.
 */
export async function fetchSaveLists(): Promise<SaveList[]> {
  const res = await apiClient.get("/save-lists");
  const data = res.data;

  if (Array.isArray(data)) {
    return data as SaveList[];
  }

  if (Array.isArray((data as any)?.saveLists)) {
    return (data as any).saveLists as SaveList[];
  }
  if (Array.isArray((data as any)?.data)) {
    return (data as any).data as SaveList[];
  }

  return [];
}

/**
 * Lấy chi tiết 1 SaveList (kèm documents)
 * GET /api/save-lists/:id
 * → BFF unwrap .data, nên FE nhận SaveListDetail thuần.
 */
export async function fetchSaveListDetail(id: string): Promise<SaveListDetail> {
  const res = await apiClient.get(`/save-lists/${encodeURIComponent(id)}`);
  return res.data as SaveListDetail;
}

/**
 * Tạo mới SaveList, có thể kèm document để add luôn.
 * POST /api/save-lists
 * body: { name, documentId? }
 * → trả về SaveList (summary)
 */
export async function createSaveListAndAddDoc(
  name: string,
  docId?: string,
): Promise<SaveList> {
  const payload: { name: string; documentId?: string } = { name };
  if (docId) payload.documentId = docId;

  const res = await apiClient.post("/save-lists", payload);
  return res.data as SaveList;
}

/**
 * Thêm 1 document vào SaveList đã tồn tại.
 * POST /api/save-lists/:id/documents
 * body: { documentId }
 * → trả về SaveList (summary)
 */
export async function addDocToSaveList(
  saveListId: string,
  docId: string,
): Promise<SaveList> {
  const res = await apiClient.post(
    `/save-lists/${encodeURIComponent(saveListId)}/documents`,
    { documentId: docId },
  );

  return res.data as SaveList;
}

/**
 * Xoá document khỏi SaveList.
 * DELETE /api/save-lists/:id/documents/:docId
 * → 204 No Content
 */
export async function removeDocFromSaveList(
  saveListId: string,
  docId: string,
): Promise<void> {
  await apiClient.delete(
    `/save-lists/${encodeURIComponent(
      saveListId,
    )}/documents/${encodeURIComponent(docId)}`,
  );
}

/**
 * Xoá hẳn 1 SaveList.
 * DELETE /api/save-lists/:id
 * → 204 No Content
 */
export async function deleteSaveList(saveListId: string): Promise<void> {
  await apiClient.delete(`/save-lists/${encodeURIComponent(saveListId)}`);
}
