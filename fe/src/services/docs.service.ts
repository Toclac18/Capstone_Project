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
  // downloadCount: number;
  upvote_counts: number;
  downvote_counts: number;
  vote_scores: number;
  pageCount: number;
  thumbnail?: string;
  description?: string;
  /**
   * URL tới file PDF trên S3 (presigned URL).
   * Được set từ /documents/:id/presigned-url.
   */
  fileUrl?: string;
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

/**
 * -----------------------------
 * Kiểu BE: /api/documents/:id
 * (proxy qua Next route: GET /api/docs-view/[id])
 * -----------------------------
 */
type BackendDocumentDetail = {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  status: string;
  isPremium: boolean;
  price: number;
  thumbnailUrl: string | null;
  pageCount: number;
  viewCount: number;
  upvoteCount: number;
  downvoteCount: number;
  // downloadCount: number;
  voteScore: number;
  createdAt: string;
  updatedAt: string;
  summarizations?: {
    shortSummary?: string;
    mediumSummary?: string;
    detailedSummary?: string;
  };
  uploader?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  organization?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  docType?: {
    id: string;
    name: string;
    description?: string;
  };
  specialization?: {
    id: string;
    name: string;
    domain?: {
      id: string;
      name: string;
    };
  };
  tags?: {
    id: string;
    code: number;
    name: string;
  }[];
  userInfo?: {
    hasAccess: boolean;
    isUploader: boolean;
    hasRedeemed: boolean;
    isMemberOfOrganization: boolean;
  };
};

type BackendDocumentDetailResponse = {
  success: boolean;
  data: BackendDocumentDetail;
  timestamp: string;
};

/**
 * -----------------------------
 * Kiểu BE: /api/comments/document/:docId
 * (proxy qua Next route: GET /api/docs-view/[id]/comments)
 * -----------------------------
 */
type BackendCommentUser = {
  id: string;
  fullName: string;
};

type BackendComment = {
  id: string;
  documentId: string;
  user: BackendCommentUser;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type BackendCommentsPageInfo = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
};

type BackendCommentsResponse = {
  success: boolean;
  data: BackendComment[];
  pageInfo: BackendCommentsPageInfo;
  timestamp: string;
};

/**
 * -----------------------------
 * Kiểu BE: POST comment
 * (proxy qua Next route: POST /api/docs-view/[id]/comments)
 * -----------------------------
 */
type BackendPostCommentResponse = {
  success: boolean;
  data: BackendComment;
  timestamp: string;
};

/**
 * -----------------------------
 * Kiểu BE: /api/documents/:id/presigned-url
 * (proxy qua Next route: GET /api/documents/[id]/presigned-url)
 * -----------------------------
 */
type BackendPresignedUrlResponse = {
  success: boolean;
  data: {
    presignedUrl: string;
    expiresInMinutes: number;
  };
  timestamp: string;
};

/**
 * -----------------------------
 * FETCH DOC DETAIL + COMMENTS + PRESIGNED URL
 * -----------------------------
 *
 * - Gọi:
 *   + GET /api/docs-view/:id          -> BE /api/documents/:id
 *   + GET /api/docs-view/:id/comments -> BE /api/comments/document/:docId
 *   + GET /api/documents/:id/presigned-url -> BE presigned URL
 *
 * - Trả về shape cũ mà FE đang dùng:
 *   { detail, related, stats, comments, pageInfo }
 */
export async function fetchDocDetail(id: string) {
  const encodedId = encodeURIComponent(id);

  const [detailRes, commentsRes, urlRes] = await Promise.all([
    apiClient.get(`/docs-view/${encodedId}`),
    apiClient.get(`/docs-view/${encodedId}/comments`),
    apiClient.get(`/docs-view/${encodedId}/presigned-url`),
  ]);

  const detailPayload = detailRes.data as BackendDocumentDetailResponse;
  const commentsPayload = commentsRes.data as BackendCommentsResponse;
  const urlPayload = urlRes.data as BackendPresignedUrlResponse;

  if (!detailPayload.success) {
    throw new Error("Failed to fetch document detail");
  }
  if (!commentsPayload.success) {
    throw new Error("Failed to fetch document comments");
  }
  if (!urlPayload.success) {
    throw new Error("Failed to fetch presigned url");
  }

  const doc = detailPayload.data;
  const rawComments = commentsPayload.data;
  const presigned = urlPayload.data;

  // Map BE -> DocDetail FE
  const detail: DocDetail = {
    id: doc.id,
    title: doc.title,
    orgName: doc.organization?.name ?? "",
    uploader: doc.uploader?.fullName ?? "",
    specialization: doc.specialization?.name ?? "",
    isPremium: doc.isPremium,
    isRedeemed: doc.userInfo?.hasRedeemed ?? false,
    points: doc.price ?? null,
    viewCount: doc.viewCount ?? 0,
    // downloadCount: doc.downloadCount ?? 0,
    upvote_counts: doc.upvoteCount ?? 0,
    downvote_counts: doc.downvoteCount ?? 0,
    vote_scores: doc.voteScore ?? 0,
    pageCount: doc.pageCount ?? 0,
    thumbnail: doc.thumbnailUrl ?? undefined,
    description: doc.description ?? undefined,
    fileUrl: presigned.presignedUrl,
  };

  // Map BE comments -> Comment FE
  const comments: Comment[] = rawComments.map((c) => ({
    id: c.id,
    docId: c.documentId,
    author: c.user?.fullName ?? "Unknown",
    avatarUrl: undefined,
    content: c.content,
    createdAt: c.createdAt,
  }));

  // Stats cũ mà FE đang dùng
  const stats = {
    views: detail.viewCount,
    // downloads: detail.downloadCount,
    upvotes: detail.upvote_counts,
    downvotes: detail.downvote_counts,
  };

  // Tạm chưa có related từ BE -> để mảng rỗng
  const related: RelatedLite[] = [];

  return {
    detail,
    related,
    stats,
    comments,
    pageInfo: commentsPayload.pageInfo,
  };
}

/**
 * -----------------------------
 * REDEEM DOC
 * -----------------------------
 * Next route /api/docs-view/[id]/redeem vẫn proxy sang BE như trước.
 * Service chỉ cần map về shape FE đang dùng.
 */
export async function redeemDoc(id: string) {
  const res = await apiClient.post(
    `/docs-view/${encodeURIComponent(id)}/redeem`,
  );

  // tuỳ theo BE, đây là shape tạm:
  return res.data as {
    success: boolean;
    redeemed: boolean;
    pointsLeft?: number;
  };
}

/**
 * -----------------------------
 * VOTE (UPVOTE / DOWNVOTE)
 * -----------------------------
 * Next route /api/docs-view/[id]/upvote, /downvote proxy sang BE.
 * Trả về số vote mới, FE tự cập nhật state.
 */
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

/**
 * -----------------------------
 * ADD COMMENT
 * -----------------------------
 * Proxy POST /api/docs-view/:id/comments -> BE /api/comments/document/:docId
 * Service map từ BE comment -> FE Comment.
 */
export async function addComment(docId: string, content: string) {
  const res = await apiClient.post(
    `/docs-view/${encodeURIComponent(docId)}/comments`,
    { content },
  );

  const payload = res.data as BackendPostCommentResponse;

  if (!payload.success) {
    throw new Error("Failed to add comment");
  }

  const c = payload.data;

  const comment: Comment = {
    id: c.id,
    docId: c.documentId,
    author: c.user?.fullName ?? "Unknown",
    avatarUrl: undefined,
    content: c.content,
    createdAt: c.createdAt,
  };

  return { comment };
}

/**
 * -----------------------------
 * OPTIONAL: PRESIGNED URL SERVICE RIÊNG
 * -----------------------------
 * Nếu ở chỗ khác bạn cần lấy URL mà không gọi fetchDocDetail.
 */
export async function fetchDocPresignedUrl(id: string) {
  const encodedId = encodeURIComponent(id);
  const res = await apiClient.get(`/docs-view/${encodedId}/presigned-url`);
  const payload = res.data as BackendPresignedUrlResponse;

  if (!payload.success) {
    throw new Error("Failed to get presigned url");
  }

  return payload.data;
}

// UPDATE COMMENT
export async function updateComment(commentId: string, content: string) {
  const res = await apiClient.put(
    `/comments/${encodeURIComponent(commentId)}`,
    {
      content,
    },
  );

  // BE expected: { success: true }
  return res.data as {
    success: boolean;
  };
}

// DELETE COMMENT
export async function deleteComment(commentId: string) {
  const res = await apiClient.delete(
    `/comments/${encodeURIComponent(commentId)}`,
  );

  // BE expected: { success: true }
  return res.data as {
    success: boolean;
  };
}
