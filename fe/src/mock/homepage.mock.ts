/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Mock data cho homepage – chuẩn hóa model/field để BE dễ implement.
 * Nếu cần, có thể chuyển sang đọc file JSON sau này mà không đổi shape.
 */

export type ReaderLite = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
};

export type OrganizationLite = {
  id: string;
  name: string;
  slug?: string;
};

export type SavedListLite = {
  id: string;
  name: string;
};

export type DocumentLite = {
  id: string;
  title: string;
  subject?: string;
  pageCount?: number;
  owned?: boolean; // mua hoặc upload thành công
  previewUrl?: string; // FE có thể dùng hiển thị thumbnail
};

/* ===================== READER ===================== */
export const mockReader: ReaderLite = {
  id: "reader_001",
  fullName: "Nguyễn Tất Quân",
  username: "tatquan",
  email: "tatquan@example.com",
  status: "ACTIVE",
};

/* ===================== ORGANIZATIONS (joined) ===================== */
export const mockOrganizations: OrganizationLite[] = [
  { id: "org_001", name: "HUST Computer Science", slug: "hust-cs" },
  { id: "org_002", name: "Japanese Elementary", slug: "jp-elem" },
  { id: "org_003", name: "AI Research Group", slug: "ai-research" },
];

/* ===================== SAVED LISTS ===================== */
export const mockSavedLists: SavedListLite[] = [
  { id: "list_001", name: "OOP exam prep" },
  { id: "list_002", name: "Japanese N5 grammar" },
  { id: "list_003", name: "AI & ML" },
];

/* ===================== LIBRARY (owned docs) ===================== */
export const mockLibraryDocs: DocumentLite[] = [
  {
    id: "doc_001",
    title: "Report Sample - Final Project Assignment",
    subject: "Software Requirement",
    pageCount: 15,
    owned: true,
  },
  {
    id: "doc_002",
    title: "SWE201c – Introduction to Software Engineering",
    subject: "Software Engineering",
    pageCount: 18,
    owned: true,
  },
  {
    id: "doc_003",
    title: "Dekiru Sơ cấp – Ngữ pháp 06",
    subject: "Japanese Grammar",
    pageCount: 6,
    owned: true,
  },
  {
    id: "doc_004",
    title: "Key-SSL101 – New Words List Dekiru Nihongo",
    subject: "Vocabulary",
    pageCount: 195,
    owned: true,
  },
  {
    id: "doc_005",
    title: "Intro to Database Systems - Lecture Notes",
    subject: "Database Systems",
    pageCount: 32,
    owned: true,
  },
  {
    id: "doc_006",
    title: "Python for Data Science Handbook",
    subject: "Data Science",
    pageCount: 420,
    owned: true,
  },
  {
    id: "doc_007",
    title: "Object-Oriented Programming Examples (C++)",
    subject: "OOP in C++",
    pageCount: 68,
    owned: true,
  },
];

/* ===================== CONTINUE READING ===================== */
export const mockContinueReading: DocumentLite[] = [
  mockLibraryDocs[0],
  mockLibraryDocs[2],
  mockLibraryDocs[4],
  mockLibraryDocs[6],
];

/* ===================== BEST FOR YOU ===================== */
export const mockBestForYou: DocumentLite[] = [
  {
    id: "doc_008",
    title: "100 Essential Grammar Quizzes for Beginners",
    subject: "English Grammar",
    pageCount: 52,
  },
  {
    id: "doc_009",
    title: "Final Practice Quiz – Software Design Patterns",
    subject: "Software Design",
    pageCount: 20,
  },
  {
    id: "doc_010",
    title: "N5 Listening Practice – 20 Lessons",
    subject: "Japanese Listening",
    pageCount: 27,
  },
];

/* ===================== SAVED DOCUMENT IDS ===================== */
export const mockSavedDocumentIds: string[] = ["doc_002", "doc_004", "doc_009"];

/* ===================== helpers simulate latency ===================== */
export function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms));
}
