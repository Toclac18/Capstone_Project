// src/services/docsService.ts
import { apiClient } from "./http";

/* -------------------------------------------------------------------------- */
/*                             PUBLIC FE TYPE EXPORTS                         */
/* -------------------------------------------------------------------------- */

export type Comment = {
  id: string;
  docId: string;
  author: string;
  userId?: string; // ID của user tạo comment
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

/* -------------------------------------------------------------------------- */
/*                             BACKEND RAW TYPES                              */
/* -------------------------------------------------------------------------- */
/* 1. Document detail (/api/documents/:id)                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* 2. Comments list (/api/comments/document/:docId)                           */
/* -------------------------------------------------------------------------- */

type BackendComment = {
  id: string;
  documentId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
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

/* -------------------------------------------------------------------------- */
/* 3. POST comment (/api/comments/document/:docId)                            */
/* -------------------------------------------------------------------------- */

type BackendPostCommentResponse = {
  success: boolean;
  data: BackendComment | { comment: BackendComment } | { data: BackendComment };
  timestamp: string;
};

/* -------------------------------------------------------------------------- */
/* 4. Presigned URL (/api/documents/:id/presigned-url)                        */
/* -------------------------------------------------------------------------- */

type BackendPresignedUrlResponse = {
  success: boolean;
  data: {
    presignedUrl: string;
    expiresInMinutes: number;
  };
  timestamp: string;
};

/* -------------------------------------------------------------------------- */
/*                         MAPPING HELPERS (BE -> FE)                         */
/* -------------------------------------------------------------------------- */

function mapBackendComment(c: BackendComment): Comment {
  return {
    id: c.id,
    docId: c.documentId,
    author: c.user?.fullName ?? "Unknown",
    userId: c.user?.id,
    avatarUrl: c.user?.avatarUrl ?? undefined,
    content: c.content,
    createdAt: c.createdAt,
  };
}

function extractBackendCommentFromPostPayload(
  payload: BackendPostCommentResponse,
): BackendComment {
  const raw = payload.data as any;

  if (raw && raw.id) {
    // case 1: data là comment trực tiếp
    return raw as BackendComment;
  }

  if (raw && raw.comment && raw.comment.id) {
    // case 2: data: { comment: {...} }
    return raw.comment as BackendComment;
  }

  if (raw && raw.data && raw.data.id) {
    // case 3: data: { data: {...} }
    return raw.data as BackendComment;
  }

  // fallback: cứ trả raw, để map phía sau detect lỗi
  return raw as BackendComment;
}

/* -------------------------------------------------------------------------- */
/*           DOCUMENT DETAIL + COMMENTS + PRESIGNED URL (COMPOSITE)           */
/* -------------------------------------------------------------------------- */
/**
 * FETCH DOC DETAIL + COMMENTS + PRESIGNED URL
 *
 * - Gọi:
 *   + GET /docs-view/:id                -> BE /api/documents/:id
 *   + GET /docs-view/:id/comments       -> BE /api/comments/document/:docId
 *   + GET /docs-view/:id/presigned-url  -> BE presigned URL
 *
 * - Trả về:
 *   { detail, related, stats, comments, pageInfo }
 */

export async function fetchCommentsPage(
  documentId: string,
  page: number = 0,
  size: number = 20,
): Promise<{ comments: Comment[]; pageInfo: BackendCommentsPageInfo }> {
  const encodedId = encodeURIComponent(documentId);

  const res = await apiClient.get(`/docs-view/${encodedId}/comments`, {
    params: { page, size },
  });

  const payload = res.data as BackendCommentsResponse;

  if (!payload.success) {
    throw new Error("Failed to fetch document comments");
  }

  const rawComments = payload.data ?? [];
  const comments: Comment[] = rawComments.map(mapBackendComment);

  return {
    comments,
    pageInfo: payload.pageInfo,
  };
}

export async function fetchDocDetail(id: string) {
  const encodedId = encodeURIComponent(id);

  const [detailRes, urlRes, commentsResult] = await Promise.all([
    apiClient.get(`/docs-view/${encodedId}`),
    apiClient.get(`/docs-view/${encodedId}/presigned-url`),
    // lấy page 0, size 20 cho lần load đầu
    fetchCommentsPage(id, 0, 20),
  ]);

  const detailPayload = detailRes.data as BackendDocumentDetailResponse;
  const urlPayload = urlRes.data as BackendPresignedUrlResponse;

  if (!detailPayload.success) {
    throw new Error("Failed to fetch document detail");
  }
  if (!urlPayload.success) {
    throw new Error("Failed to fetch presigned url");
  }

  const doc = detailPayload.data;
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
    upvote_counts: doc.upvoteCount ?? 0,
    downvote_counts: doc.downvoteCount ?? 0,
    vote_scores: doc.voteScore ?? 0,
    pageCount: doc.pageCount ?? 0,
    thumbnail: doc.thumbnailUrl ?? undefined,
    description: doc.description ?? undefined,
    fileUrl: presigned.presignedUrl,
  };

  // Stats cũ mà FE đang dùng
  const stats = {
    views: detail.viewCount,
    upvotes: detail.upvote_counts,
    downvotes: detail.downvote_counts,
  };

  // Tạm chưa có related từ BE -> để mảng rỗng
  const related: RelatedLite[] = [];

  return {
    detail,
    related,
    stats,
    comments: commentsResult.comments,
    pageInfo: commentsResult.pageInfo,
  };
}

/* -------------------------------------------------------------------------- */
/*                                REDEEM DOC                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                   VOTE                                      */
/* -------------------------------------------------------------------------- */
/**
 * GET: Lấy vote hiện tại của user cho document
 * POST: Vote document (voteValue: -1 downvote, 0 neutral, 1 upvote)
 */

export async function getUserVote(documentId: string) {
  const res = await apiClient.get(
    `/docs-view/${encodeURIComponent(documentId)}/vote`,
  );

  return res.data as {
    documentId: string;
    userVote: number; // -1, 0, or 1
    upvoteCount: number;
    downvoteCount: number;
    voteScore: number;
  };
}

export async function voteDocument(documentId: string, voteValue: number) {
  const res = await apiClient.post(
    `/docs-view/${encodeURIComponent(documentId)}/vote`,
    { voteValue },
  );

  return res.data as {
    documentId: string;
    userVote: number; // -1, 0, or 1
    upvoteCount: number;
    downvoteCount: number;
    voteScore: number;
  };
}

/* -------------------------------------------------------------------------- */
/*                                  COMMENTS                                  */
/* -------------------------------------------------------------------------- */
/**
 * ADD COMMENT
 * Proxy POST /docs-view/:id/comments -> BE /api/comments/document/:docId
 * Service map từ BackendComment -> FE Comment.
 */
export async function addComment(
  docId: string,
  content: string,
): Promise<Comment> {
  const res = await apiClient.post(
    `/docs-view/${encodeURIComponent(docId)}/comments`,
    { content },
  );

  const payload = res.data as BackendPostCommentResponse;

  if (!payload.success || !payload.data) {
    throw new Error("Failed to add comment");
  }

  const backendComment = extractBackendCommentFromPostPayload(payload);

  const mapped = mapBackendComment(backendComment);

  // Nếu sau tất cả mà vẫn không có id → log ra để debug BE/ngắt sớm
  if (!mapped.id && process.env.NODE_ENV !== "production") {
    console.warn("addComment: mapped comment missing id", {
      res: res.data,
      payload,
      backendComment,
      mapped,
    });
  }

  return mapped;
}

/**
 * UPDATE COMMENT
 * Proxy PUT /comments/:id -> BE update comment
 * FE hiện tại chỉ cần biết là thành công, nên trả raw để tuỳ chỗ khác dùng.
 */
export async function updateComment(commentId: string, content: string) {
  const res = await apiClient.put(
    `/comments/${encodeURIComponent(commentId)}`,
    { content },
  );

  // Backend trả CommentResponse trực tiếp
  return res.data as BackendComment;
}

/**
 * DELETE COMMENT
 * Proxy DELETE /comments/:id -> BE delete comment
 */
export async function deleteComment(commentId: string) {
  const res = await apiClient.delete(
    `/comments/${encodeURIComponent(commentId)}`,
  );

  // Backend trả ApiResponse<Void> với { success, message, data, timestamp }
  return res.data as {
    success: boolean;
    message?: string;
    data: null;
    timestamp: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                      PRESIGNED URL SERVICE DÙNG RIÊNG                      */
/* -------------------------------------------------------------------------- */

export async function fetchDocPresignedUrl(id: string) {
  const encodedId = encodeURIComponent(id);
  const res = await apiClient.get(`/docs-view/${encodedId}/presigned-url`);
  const payload = res.data as BackendPresignedUrlResponse;

  if (!payload.success) {
    throw new Error("Failed to get presigned url");
  }

  return payload.data;
}
