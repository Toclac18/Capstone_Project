// src/mock/docsDetail.ts
export type DocComment = {
  id: string;
  docId: string;
  author: string;
  avatarUrl?: string;
  content: string;
  createdAt: string; // ISO
};

export type DocDetailMock = {
  id: string;
  title: string;
  orgName: string;
  uploader: string;
  specialization: string;
  isPremium: boolean;
  points?: number | null;
  viewCount: number;
  downloadCount: number;
  upvote_counts: number;
  downvote_counts: number;
  vote_scores: number;
  pageCount: number;
  thumbnail?: string;
  description?: string;
  fileUrl: string;
  comments: DocComment[];
  isRedeemed?: boolean;
};

export const mockDocDetails: DocDetailMock[] = [
  {
    id: "11",
    title: "Practical Civil Engineering",
    orgName: "University of Oxford",
    uploader: "viet.hung",
    specialization: "Civil Engineering",
    isPremium: false,
    points: null,
    viewCount: 9876,
    downloadCount: 5,
    upvote_counts: 530,
    downvote_counts: 41,
    vote_scores: 489,
    pageCount: 226,
    thumbnail: "/placeholder-thumbnail.png",
    description:
      "This document provides a rigorous exploration of civil engineering fundamentals, methods, and case studies.",
    fileUrl: "/sample.pdf",
    comments: [
      {
        id: "c1",
        docId: "11",
        author: "Alice",
        content: "Very helpful for my exam prep, thanks!",
        createdAt: "2025-11-10T08:30:00.000Z",
      },
    ],
  },
  {
    id: "12",
    title: "Advanced Structural Analysis",
    orgName: "MIT",
    uploader: "alice",
    specialization: "Civil Engineering",
    isPremium: true,
    points: 80,
    viewCount: 12456,
    downloadCount: 342,
    upvote_counts: 820,
    downvote_counts: 73,
    vote_scores: 747,
    pageCount: 147,
    thumbnail: "/placeholder-thumbnail.png",
    description: "Premium course notes on structural analysis.",
    fileUrl: "/sample.pdf",
    comments: [],
    isRedeemed: false,
  },
];

export function findDocById(id: string) {
  return mockDocDetails.find((d) => d.id === id) || null;
}

/* ---- MOCK helpers cho các route ---- */

export function mockGetDocDetail(id: string) {
  const doc = findDocById(id);
  if (!doc) return null;

  const related = mockDocDetails
    .filter((d) => d.specialization === doc.specialization && d.id !== doc.id)
    .sort((a, b) => b.vote_scores - a.vote_scores)
    .slice(0, 8)
    .map((d) => ({
      id: d.id,
      title: d.title,
      orgName: d.orgName,
      specialization: d.specialization,
      thumbnail: d.thumbnail || "/placeholder-thumbnail.png",
      upvote_counts: d.upvote_counts,
      downvote_counts: d.downvote_counts,
      vote_scores: d.vote_scores,
      isPremium: d.isPremium,
    }));

  return {
    detail: doc,
    related,
    stats: {
      views: doc.viewCount,
      downloads: doc.downloadCount,
      upvotes: doc.upvote_counts,
      downvotes: doc.downvote_counts,
    },
    comments: doc.comments,
  };
}

export function mockRedeemDoc(id: string) {
  const doc = findDocById(id);
  if (!doc || !doc.isPremium) return { success: false, redeemed: false };

  // mock: đánh dấu là đã “redeem” – trạng thái này sẽ được GET trả về qua field isRedeemed
  doc.isRedeemed = true;

  return { success: true, redeemed: true, pointsLeft: 1200 };
}

export function mockUpvoteDoc(id: string) {
  const doc = findDocById(id);
  if (!doc) return null;

  doc.upvote_counts += 1;
  doc.vote_scores += 1;

  return {
    upvote_counts: doc.upvote_counts,
    downvote_counts: doc.downvote_counts,
    vote_scores: doc.vote_scores,
  };
}

export function mockDownvoteDoc(id: string) {
  const doc = findDocById(id);
  if (!doc) return null;

  doc.downvote_counts += 1;
  doc.vote_scores -= 1;

  return {
    upvote_counts: doc.upvote_counts,
    downvote_counts: doc.downvote_counts,
    vote_scores: doc.vote_scores,
  };
}

export function mockAddComment(docId: string, content: string, author = "You") {
  const doc = findDocById(docId);
  if (!doc) return null;

  const newComment: DocComment = {
    id: `c-${Date.now()}`,
    docId,
    author,
    content,
    createdAt: new Date().toISOString(),
  };
  doc.comments.unshift(newComment);
  return newComment;
}
