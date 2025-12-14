// src/services/saveListService.ts
import { apiClient } from "./http";
import type { SaveList } from "@/types/saveList";

export async function fetchSaveLists(id: string): Promise<SaveList[]> {
  const res = await apiClient.get("/save-lists", {
    params: { id },
  });

  const responseBody = res.data;

  if (responseBody && Array.isArray(responseBody.data)) {
    return responseBody.data;
  }

  return [];
}

export async function addDocToSaveList(
  saveListId: string,
  docId: string,
  readerId: string,
) {
  const res = await apiClient.post(
    `/save-lists/${encodeURIComponent(saveListId)}/documents`,
    { documentId: docId, readerId },
  );
  return res.data;
}

export async function createSaveListAndAddDoc(
  readerId: string,
  name: string,
  docId: string,
) {
  const res = await apiClient.post("/save-lists", {
    readerId,
    name,
    documentId: docId,
  });
  return res.data;
}
