// src/services/docsService.ts
import { apiClient } from "./http";

export type Comment = {
  id: string;
  docId: string;
  author: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
};

export type DocDetail = {
  id: string;
  title: string;
  orgName: string;
  uploader: string;
  specialization: string;
  isPremium: boolean;
  isRedeemed?: boolean;
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
};

export type RelatedLite = {
  id: string;
  title: string;
  orgName: string;
  specialization: string;
  thumbnail?: string;
  upvote_counts: number;
  downvote_counts: number;
  vote_scores: number;
  isPremium: boolean;
};

export async function fetchDocDetail(id: string) {
  const res = await apiClient.get(`/docs-view/${encodeURIComponent(id)}`);
  return res.data as {
    detail: DocDetail;
    related: RelatedLite[];
    stats: {
      views: number;
      downloads: number;
      upvotes: number;
      downvotes: number;
    };
    comments: Comment[];
  };
}

export async function redeemDoc(id: string) {
  const res = await apiClient.post(
    `/docs-view/${encodeURIComponent(id)}/redeem`,
  );
  return res.data as {
    success: boolean;
    redeemed: boolean;
    pointsLeft?: number;
  };
}

export async function upvoteDoc(id: string) {
  const res = await apiClient.post(
    `/docs-view/${encodeURIComponent(id)}/upvote`,
  );
  return res.data as {
    upvote_counts: number;
    downvote_counts: number;
    vote_scores: number;
  };
}

export async function downvoteDoc(id: string) {
  const res = await apiClient.post(
    `/docs-view/${encodeURIComponent(id)}/downvote`,
  );
  return res.data as {
    upvote_counts: number;
    downvote_counts: number;
    vote_scores: number;
  };
}

export async function addComment(docId: string, content: string) {
  const res = await apiClient.post(
    `/docs-view/${encodeURIComponent(docId)}/comments`,
    {
      content,
    },
  );
  return res.data as { comment: Comment };
}
