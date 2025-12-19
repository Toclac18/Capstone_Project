import { apiClient } from "./http";

export type Comment = {
  id: string;
  docId: string;
  author: string;
  userId?: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
};

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

type BackendPostCommentResponse = {
  success: boolean;
  data: BackendComment | { comment: BackendComment } | { data: BackendComment };
  timestamp: string;
};

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

  if (raw && raw.id) return raw as BackendComment;
  if (raw && raw.comment && raw.comment.id)
    return raw.comment as BackendComment;
  if (raw && raw.data && raw.data.id) return raw.data as BackendComment;
  return raw as BackendComment;
}

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

export async function updateComment(commentId: string, content: string) {
  const res = await apiClient.put(
    `/comments/${encodeURIComponent(commentId)}`,
    {
      content,
    },
  );

  return res.data as BackendComment;
}

export async function deleteComment(commentId: string) {
  const res = await apiClient.delete(
    `/comments/${encodeURIComponent(commentId)}`,
  );

  return res.data as {
    success: boolean;
    message?: string;
    data: null;
    timestamp: string;
  };
}
