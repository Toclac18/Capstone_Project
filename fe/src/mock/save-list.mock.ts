// src/mock/save-list.mock.ts
// Mock SavedList mapping trực tiếp với mockDocDetails

import { mockDocDetails } from "./docs-detail.mock";

export type SaveListMock = {
  id: string;
  name: string;
  docIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type SaveListSummaryMock = {
  id: string;
  name: string;
  docCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SaveListDetailMock = SaveListSummaryMock & {
  documents: any[];
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  timestamp: string;
};

const nowIso = () => new Date().toISOString();

// ---- In-memory data ----
let SAVE_LISTS: SaveListMock[] = [
  {
    id: "c19c2990-b6d6-45b1-9c48-37b60015074d",
    name: "My first list",
    docIds: ["1d2eb26d-a92d-3183-ae10-2448113ec466"],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

const toSummary = (list: SaveListMock): SaveListSummaryMock => ({
  id: list.id,
  name: list.name,
  docCount: list.docIds.length,
  createdAt: list.createdAt,
  updatedAt: list.updatedAt,
});

const toDetail = (list: SaveListMock): SaveListDetailMock => {
  const documents = list.docIds
    .map((docId) => mockDocDetails.find((d: any) => d.id === docId))
    .filter(Boolean);

  return {
    ...toSummary(list),
    documents,
  };
};

const wrap = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: nowIso(),
});

// ---- Public mock APIs (dùng trong route.ts) ----

// GET /save-lists
export function mockGetSaveLists(): ApiResponse<SaveListSummaryMock[]> {
  return wrap(SAVE_LISTS.map(toSummary));
}

// GET /save-lists/:id
export function mockGetSaveListDetail(
  id: string,
): ApiResponse<SaveListDetailMock> | null {
  const found = SAVE_LISTS.find((l) => l.id === id);
  if (!found) return null;
  return wrap(toDetail(found));
}

// POST /save-lists
export function mockCreateSaveList(
  name: string,
  documentId?: string,
): ApiResponse<SaveListSummaryMock> {
  const id = crypto.randomUUID();
  const now = nowIso();

  const docIds: string[] = [];
  if (documentId) docIds.push(documentId);

  const list: SaveListMock = {
    id,
    name,
    docIds,
    createdAt: now,
    updatedAt: now,
  };

  SAVE_LISTS.push(list);
  return wrap(toSummary(list));
}

// POST /save-lists/:id/documents
export function mockAddDocToSaveList(
  listId: string,
  documentId: string,
): ApiResponse<SaveListSummaryMock> | null {
  const list = SAVE_LISTS.find((l) => l.id === listId);
  if (!list) return null;

  if (!list.docIds.includes(documentId)) {
    list.docIds.push(documentId);
    list.updatedAt = nowIso();
  }

  return wrap(toSummary(list));
}

// DELETE /save-lists/:id/documents/:docId
export function mockRemoveDocFromSaveList(
  listId: string,
  docId: string,
): boolean {
  const list = SAVE_LISTS.find((l) => l.id === listId);
  if (!list) return false;

  const before = list.docIds.length;
  list.docIds = list.docIds.filter((id) => id !== docId);
  if (list.docIds.length !== before) {
    list.updatedAt = nowIso();
    return true;
  }
  return false;
}

// DELETE /save-lists/:id
export function mockDeleteSaveList(listId: string): boolean {
  const before = SAVE_LISTS.length;
  SAVE_LISTS = SAVE_LISTS.filter((l) => l.id !== listId);
  return SAVE_LISTS.length !== before;
}
