// src/mock/saveList.ts
// Mock SaveList mapping trực tiếp với mockDocDetails

import { mockDocDetails } from "./docsDetail"; // path đúng: "@/mock/docsDetail" nếu cần

export type SaveListMock = {
  id: string;
  name: string;
  readerId: string;
  docIds: string[]; // id của DocDetailMock (vd: "11", "12")
  createdAt: string; // ISO string
};

export type SaveListItem = {
  id: string;
  name: string;
  docCount: number;
};

// ====== MOCK DATA ======

// Giả sử ta có 2 reader mock để test:
// - "reader-1": bác sĩ nội trú
// - "reader-2": sinh viên
const READER_1 = "reader-1";
const READER_2 = "reader-2";

// Lấy sẵn id docs từ mockDocDetails cho chắc
const DOC_11 = mockDocDetails[0]?.id ?? "11"; // Practical Civil Engineering
const DOC_12 = mockDocDetails[1]?.id ?? "12"; // Advanced Structural Analysis

const SAVE_LISTS: SaveListMock[] = [
  {
    id: "savelist-1",
    name: "Civil Engineering Basics",
    readerId: READER_1,
    // mapping CHUẨN với docsDetail: doc 11 (free) + doc 12 (premium)
    docIds: [DOC_11, DOC_12],
    createdAt: new Date("2025-11-01T09:00:00.000Z").toISOString(),
  },
  {
    id: "savelist-2",
    name: "Premium Structural Notes",
    readerId: READER_1,
    // chỉ chứa doc premium (12)
    docIds: [DOC_12],
    createdAt: new Date("2025-11-05T14:30:00.000Z").toISOString(),
  },
  {
    id: "savelist-3",
    name: "Student References",
    readerId: READER_2,
    // chỉ chứa doc free (11)
    docIds: [DOC_11],
    createdAt: new Date("2025-11-02T10:15:00.000Z").toISOString(),
  },
];

// ====== INTERNAL HELPERS ======

function findByReader(readerId: string) {
  return SAVE_LISTS.filter((l) => l.readerId === readerId);
}

function findById(id: string) {
  return SAVE_LISTS.find((l) => l.id === id) ?? null;
}

function toItem(list: SaveListMock): SaveListItem {
  return {
    id: list.id,
    name: list.name,
    docCount: list.docIds.length,
  };
}

// ====== API-LIKE MOCK FUNCTIONS ======

/**
 * Lấy danh sách Save List (id, name, docCount) của 1 reader
 * → dùng trong GET /api/save-lists?readerId=...
 */
export function mockFetchSaveLists(readerId: string): SaveListItem[] {
  return findByReader(readerId).map(toItem);
}

/**
 * Tạo mới SaveList và thêm luôn 1 doc (mapping với docsDetail qua docId)
 * → dùng trong POST /api/save-lists (mode mock)
 */
export function mockCreateSaveListAndAddDoc(payload: {
  readerId: string;
  name: string;
  documentId: string;
}) {
  const id = `savelist-${Date.now()}`;
  const now = new Date().toISOString();

  const list: SaveListMock = {
    id,
    name: payload.name,
    readerId: payload.readerId,
    docIds: [payload.documentId],
    createdAt: now,
  };

  SAVE_LISTS.push(list);

  return {
    list: toItem(list),
    documentId: payload.documentId,
    createdAt: now,
  };
}

/**
 * Thêm doc vào SaveList có sẵn (nếu chưa có)
 * → dùng trong POST /api/save-lists/[id]/documents (mode mock)
 */
export function mockAddDocToSaveList(
  listId: string,
  payload: { readerId: string; documentId: string },
) {
  const list = findById(listId);
  if (!list) return null;

  // Đảm bảo đúng reader (nếu bạn muốn check)
  if (list.readerId !== payload.readerId) {
    // cho nhẹ nhàng: vẫn trả null => 404 ở route
    return null;
  }

  // Không thêm trùng
  if (!list.docIds.includes(payload.documentId)) {
    list.docIds.push(payload.documentId);
  }

  return {
    list: toItem(list),
    documentId: payload.documentId,
    updatedAt: new Date().toISOString(),
  };
}
