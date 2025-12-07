// src/mock/search-document.mock.ts

/**
 * Mô phỏng đúng shape 1 item trong BE /search
 * (không bao gồm pageInfo / success).
 */
export type SearchDocumentMock = {
  id: string;
  title: string;
  description: string;
  isPremium: boolean;
  price: number;
  thumbnailUrl: string | null;
  createdAt: string;
  viewCount: number;
  upvoteCount: number;
  voteScore: number;
  docTypeName: string;
  specializationName: string;
  domainName: string;
  tagNames: string[];
  summarizations: {
    shortSummary: string;
    mediumSummary: string;
    detailedSummary: string;
  };
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  uploader: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
};

const DOC_TYPES = ["REPORT", "THESIS", "EXAM", "SLIDE"] as const;
const SPECIALIZATIONS = [
  "Mathematical Sciences",
  "Computer Science",
  "Economics",
  "Physics",
] as const;
const DOMAINS = [
  "NATURAL AND PHYSICAL SCIENCES",
  "INFORMATION AND COMPUTING SCIENCES",
  "ECONOMICS",
  "ENGINEERING",
] as const;

const ORGANIZATIONS = [
  {
    id: "org-1",
    name: "Đại học Bách Khoa Hà Nội",
  },
  {
    id: "org-2",
    name: "Đại học Quốc gia Hà Nội",
  },
  {
    id: "org-3",
    name: "Đại học Công nghệ Thông tin",
  },
  {
    id: "org-4",
    name: "Đại học Kinh tế Quốc dân",
  },
  {
    id: "org-5",
    name: "Đại học FPT",
  },
] as const;

const UPLOADERS = Array.from({ length: 10 }, (_, i) => ({
  id: `user-${i + 1}`,
  fullName: `Người dùng ${i + 1}`,
}));

/**
 * 100 bản ghi mô phỏng data từ BE /search
 */
export const searchDocumentMocks: SearchDocumentMock[] = Array.from(
  { length: 100 },
  (_, index) => {
    const i = index + 1;

    const org = ORGANIZATIONS[i % ORGANIZATIONS.length];
    const uploader = UPLOADERS[i % UPLOADERS.length];

    const docTypeName = DOC_TYPES[i % DOC_TYPES.length];
    const specializationName = SPECIALIZATIONS[i % SPECIALIZATIONS.length];
    const domainName = DOMAINS[i % DOMAINS.length];

    const isPremium = i % 3 === 0; // khoảng 1/3 là premium
    const priceBase = 100 + (i % 5) * 50; // 100, 150, 200, 250, 300

    const viewCount = i * 3;
    const upvoteCount = i * 2;
    const voteScore = upvoteCount - i;

    const day = (i % 28 || 1).toString().padStart(2, "0");
    const createdAt = `2025-12-${day}T10:00:00.000Z`;

    const title = `Mock Document ${i}`;
    const description = `Mô tả chi tiết cho tài liệu mock số ${i}. Đây là nội dung mô phỏng để test trang search, bao gồm nhiều trường giống với response thật từ BE.`;

    const shortSummary = `Tóm tắt ngắn gọn cho tài liệu mock số ${i}.`;
    const mediumSummary = `Tóm tắt vừa phải cho tài liệu mock số ${i}, giải thích các ý chính và đưa ra một vài ví dụ minh hoạ.`;
    const detailedSummary = `Tóm tắt chi tiết cho tài liệu mock số ${i}, đi sâu vào phân tích, bối cảnh, phương pháp và các ứng dụng liên quan.`;

    const tagNames = [`tag${i % 4}`, `tag${i % 7}`];

    return {
      id: `mock-doc-${i.toString().padStart(3, "0")}`,
      title,
      description,
      isPremium,
      price: priceBase,
      thumbnailUrl: `/thumbnail-3.jpg`,
      createdAt,
      viewCount,
      upvoteCount,
      voteScore,
      docTypeName,
      specializationName,
      domainName,
      tagNames,
      summarizations: {
        shortSummary,
        mediumSummary,
        detailedSummary,
      },
      organization: {
        id: org.id,
        name: org.name,
        logoUrl: `/thumbnail-3.png`,
      },
      uploader: {
        id: uploader.id,
        fullName: uploader.fullName,
        avatarUrl: null,
      },
    };
  },
);
