// src/services/docsService.ts
import { apiClient } from "./http"; // đường dẫn tới file apiClient của bạn

export type DocDetail = {
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
  // apiClient.baseURL = "/api"  -> gọi tới /api/docs/:id
  const res = await apiClient.get(`/docs-view/${encodeURIComponent(id)}`, {
    // axios sẽ không cache theo HTTP; thêm headers nếu bạn có layer CDN
    headers: { "Cache-Control": "no-store" },
  });
  return res.data as {
    detail: DocDetail;
    related: RelatedLite[];
    stats: {
      views: number;
      downloads: number;
      upvotes: number;
      downvotes: number;
    };
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
