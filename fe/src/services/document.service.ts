import { apiClient } from "./http";
import { fetchCommentsPage } from "./comment.service";

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

type BackendPresignedUrlResponse = {
  success: boolean;
  data: {
    presignedUrl: string;
    expiresInMinutes: number;
  };
  timestamp: string;
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
  upvote_counts: number;
  downvote_counts: number;
  vote_scores: number;
  pageCount: number;
  thumbnail?: string;
  description?: string;
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

  const stats = {
    views: detail.viewCount,
    upvotes: detail.upvote_counts,
    downvotes: detail.downvote_counts,
  };

  const related: RelatedLite[] = [];

  return {
    detail,
    related,
    stats,
    comments: commentsResult.comments,
    pageInfo: commentsResult.pageInfo,
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

export async function fetchDocPresignedUrl(id: string) {
  const encodedId = encodeURIComponent(id);
  const res = await apiClient.get(`/docs-view/${encodedId}/presigned-url`);
  const payload = res.data as BackendPresignedUrlResponse;

  if (!payload.success) {
    throw new Error("Failed to get presigned url");
  }

  return payload.data;
}

/**
 * Fetch only userInfo for a document (for modal preview)
 * Returns hasRedeemed, isUploader, hasAccess, etc.
 */
export type DocumentUserInfo = {
  hasAccess: boolean;
  isUploader: boolean;
  hasRedeemed: boolean;
  isMemberOfOrganization: boolean;
  isReviewer?: boolean;
};

export async function fetchDocumentUserInfo(
  id: string,
): Promise<DocumentUserInfo | null> {
  try {
    const encodedId = encodeURIComponent(id);
    const res = await apiClient.get(`/docs-view/${encodedId}`);
    const payload = res.data as BackendDocumentDetailResponse;

    if (!payload.success || !payload.data.userInfo) {
      return null;
    }

    return {
      hasAccess: payload.data.userInfo.hasAccess,
      isUploader: payload.data.userInfo.isUploader,
      hasRedeemed: payload.data.userInfo.hasRedeemed,
      isMemberOfOrganization: payload.data.userInfo.isMemberOfOrganization,
      isReviewer: false, // BE có thể chưa trả field này
    };
  } catch {
    return null;
  }
}
