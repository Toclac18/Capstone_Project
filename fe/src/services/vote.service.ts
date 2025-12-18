import { apiClient } from "./http";

export type VoteResponse = {
  documentId: string;
  userVote: number; // -1, 0, or 1
  upvoteCount: number;
  downvoteCount: number;
  voteScore: number;
};

export async function getUserVote(documentId: string): Promise<VoteResponse> {
  const res = await apiClient.get(
    `/docs-view/${encodeURIComponent(documentId)}/vote`,
  );
  const raw = res.data as any;

  return mapVoteResponse(raw);
}

export async function voteDocument(
  documentId: string,
  voteValue: number,
): Promise<VoteResponse> {
  const res = await apiClient.post(
    `/docs-view/${encodeURIComponent(documentId)}/vote`,
    { voteValue },
  );

  const raw = res.data as any;

  return mapVoteResponse(raw);
}

function mapVoteResponse(raw: any): VoteResponse {
  if (!raw) {
    return {
      documentId: "",
      userVote: 0,
      upvoteCount: 0,
      downvoteCount: 0,
      voteScore: 0,
    };
  }

  const documentId = raw.documentId ?? raw.document_id ?? String(raw.id ?? "");
  const userVote =
    Number(raw.userVote ?? raw.user_vote ?? raw.voteValue ?? 0) || 0;
  const upvoteCount =
    Number(
      raw.upvoteCount ??
        raw.upvotes ??
        raw.up_vote_count ??
        raw.upVoteCount ??
        0,
    ) || 0;
  const downvoteCount =
    Number(raw.downvoteCount ?? raw.downvotes ?? raw.down_vote_count ?? 0) || 0;
  const voteScore =
    Number(
      raw.voteScore ??
        raw.vote_score ??
        raw.voteScoreValue ??
        upvoteCount - downvoteCount,
    ) || 0;

  return {
    documentId,
    userVote,
    upvoteCount,
    downvoteCount,
    voteScore,
  };
}
