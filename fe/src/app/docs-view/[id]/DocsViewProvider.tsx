// src/app/docs-view/[id]/DocsViewProvider.tsx
"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  fetchDocDetail,
  redeemDoc,
  getUserVote,
  voteDocument,
  addComment,
  updateComment as updateCommentApi,
  deleteComment as deleteCommentApi,
  type DocDetail,
  type RelatedLite,
  type Comment,
} from "@/services/docs.service";

type DocsContextValue = {
  loading: boolean;
  error: string | null;
  detail?: DocDetail;
  related: RelatedLite[];

  page: number;
  setPage: (p: number) => void;
  numPages: number;
  setNumPages: (n: number) => void;
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;

  query: string;
  setQuery: (q: string) => void;
  hits: number[];
  goNextHit: () => void;
  goPrevHit: () => void;

  // vote
  userVote: number; // -1 (downvote), 0 (neutral), 1 (upvote)
  voteLoading: boolean;
  handleUpvote: () => Promise<void>;
  handleDownvote: () => Promise<void>;

  // premium / redeem
  redeemed: boolean;
  isRedeemModalOpen: boolean;
  redeemLoading: boolean;
  openRedeemModal: () => void;
  closeRedeemModal: () => void;
  redeem: () => Promise<void>;

  // comments
  comments: Comment[];
  commentLoading: boolean;
  addNewComment: (content: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;

  // text search
  onPageText: (pageNumber: number, text: string) => void;
};

const DocsCtx = createContext<DocsContextValue | null>(null);

export const useDocsView = () => {
  const ctx = useContext(DocsCtx);
  if (!ctx) throw new Error("useDocsView must be used inside DocsViewProvider");
  return ctx;
};

export function DocsViewProvider({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DocDetail>();
  const [related, setRelated] = useState<RelatedLite[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.1);

  const [query, setQuery] = useState("");
  const pagesTextRef = useRef<Record<number, string>>({});
  const [hits, setHits] = useState<number[]>([]);
  const [hitIndex, setHitIndex] = useState(0);

  const [redeemed, setRedeemed] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const [userVote, setUserVote] = useState<number>(0); // -1, 0, or 1 (default: 0 = no vote)
  const [voteLoading, setVoteLoading] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);

  // -----------------------------
  // LOAD DOC DETAIL + COMMENTS
  // -----------------------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchDocDetail(id);
        if (!mounted) return;

        const doc = data.detail;

        setDetail(doc);
        setRelated(data.related);
        setNumPages(doc.pageCount || 0);
        setPage(1);

        // reset search state
        setQuery("");
        setHits([]);
        setHitIndex(0);
        pagesTextRef.current = {};

        // redeemed state
        const initialRedeemed = doc.isPremium ? !!doc.isRedeemed : true;
        setRedeemed(initialRedeemed);
        setIsRedeemModalOpen(false);
        setRedeemLoading(false);

        // ✅ GET COMMENTS TỪ BE
        setComments(data.comments || []);

        // ✅ GET USER VOTE
        try {
          const voteData = await getUserVote(id);
          if (!mounted) return;
          // userVote có thể là -1, 0, hoặc 1
          setUserVote(voteData.userVote ?? 0);
        } catch (e: any) {
          // Nếu user chưa đăng nhập hoặc chưa vote, userVote sẽ là 0
          if (!mounted) return;
          setUserVote(0);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load document");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  // -----------------------------
  // ZOOM
  // -----------------------------
  const zoomIn = () => setScale((s) => Math.min(3, s + 0.1));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.1));

  // -----------------------------
  // TEXT SEARCH
  // -----------------------------
  const onPageText = (pageNumber: number, text: string) => {
    pagesTextRef.current[pageNumber] = text.toLowerCase();
    if (query.trim()) recomputeHits(query);
  };

  const recomputeHits = (q: string) => {
    const norm = q.toLowerCase().trim();
    if (!norm) {
      setHits([]);
      setHitIndex(0);
      return;
    }

    const all: number[] = [];
    const max = numPages || detail?.pageCount || 0;

    for (let p = 1; p <= max; p++) {
      const t = pagesTextRef.current[p];
      if (t && t.includes(norm)) {
        all.push(p);
      }
    }

    setHits(all);

    if (all.length) {
      const idx = all.findIndex((p) => p >= page);
      const target = all[idx >= 0 ? idx : 0];
      setHitIndex(idx >= 0 ? idx : 0);
      if (target !== page) setPage(target);
    } else {
      setHitIndex(0);
    }
  };

  useEffect(() => {
    recomputeHits(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, numPages]);

  const goNextHit = () => {
    if (!hits.length) return;
    const ni = (hitIndex + 1) % hits.length;
    setHitIndex(ni);
    setPage(hits[ni]);
  };

  const goPrevHit = () => {
    if (!hits.length) return;
    const ni = (hitIndex - 1 + hits.length) % hits.length;
    setHitIndex(ni);
    setPage(hits[ni]);
  };

  // -----------------------------
  // VOTE
  // -----------------------------
  const handleUpvote = async () => {
    if (!detail) return;
    try {
      setVoteLoading(true);
      // Nếu đã upvote rồi thì remove vote (voteValue = 0), ngược lại thì upvote (voteValue = 1)
      const newVoteValue = userVote === 1 ? 0 : 1;
      const res = await voteDocument(detail.id, newVoteValue);
      
      // Cập nhật userVote và counts
      setUserVote(res.userVote);
      setDetail((d) =>
        d
          ? {
              ...d,
              upvote_counts: res.upvoteCount,
              downvote_counts: res.downvoteCount,
              vote_scores: res.voteScore,
            }
          : d,
      );
    } catch (e: any) {
      setError(e?.message || "Upvote failed");
    } finally {
      setVoteLoading(false);
    }
  };

  const handleDownvote = async () => {
    if (!detail) return;
    try {
      setVoteLoading(true);
      // Nếu đã downvote rồi thì remove vote (voteValue = 0), ngược lại thì downvote (voteValue = -1)
      const newVoteValue = userVote === -1 ? 0 : -1;
      const res = await voteDocument(detail.id, newVoteValue);
      
      // Cập nhật userVote và counts
      setUserVote(res.userVote);
      setDetail((d) =>
        d
          ? {
              ...d,
              upvote_counts: res.upvoteCount,
              downvote_counts: res.downvoteCount,
              vote_scores: res.voteScore,
            }
          : d,
      );
    } catch (e: any) {
      setError(e?.message || "Downvote failed");
    } finally {
      setVoteLoading(false);
    }
  };

  // -----------------------------
  // REDEEM
  // -----------------------------
  const openRedeemModal = () => setIsRedeemModalOpen(true);
  const closeRedeemModal = () => {
    if (!redeemLoading) setIsRedeemModalOpen(false);
  };

  const redeem = async () => {
    if (!detail || redeemed) return;

    try {
      setRedeemLoading(true);
      setError(null);

      const res = await redeemDoc(detail.id);

      if (!res.success || !res.redeemed) {
        throw new Error("Redeem failed");
      }

      setDetail((d) =>
        d
          ? {
              ...d,
              isRedeemed: true,
            }
          : d,
      );
      setRedeemed(true);
      setIsRedeemModalOpen(false);
    } catch (e: any) {
      setError(e?.message || "Redeem failed");
    } finally {
      setRedeemLoading(false);
    }
  };

  // -----------------------------
  // COMMENTS: GET (đã ở useEffect), ADD, EDIT, DELETE
  // -----------------------------
  const addNewComment = async (content: string) => {
    if (!detail) return;
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      setCommentLoading(true);
      const res = await addComment(detail.id, trimmed);
      // BE trả { comment }, mình thêm lên đầu list
      setComments((prev) => [res.comment, ...prev]);
    } catch (e: any) {
      setError(e?.message || "Add comment failed");
    } finally {
      setCommentLoading(false);
    }
  };

  const editComment = async (commentId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      setCommentLoading(true);
      await updateCommentApi(commentId, trimmed);

      // Optimistic update
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: trimmed } : c)),
      );
    } catch (e: any) {
      setError(e?.message || "Update comment failed");
    } finally {
      setCommentLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      setCommentLoading(true);
      await deleteCommentApi(commentId);

      // Optimistic remove
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e: any) {
      setError(e?.message || "Delete comment failed");
    } finally {
      setCommentLoading(false);
    }
  };

  const value: DocsContextValue = {
    loading,
    error,
    detail,
    related,

    page,
    setPage,
    numPages,
    setNumPages,
    scale,
    zoomIn,
    zoomOut,

    query,
    setQuery,
    hits,
    goNextHit,
    goPrevHit,

    userVote,
    voteLoading,
    handleUpvote,
    handleDownvote,

    redeemed,
    isRedeemModalOpen,
    redeemLoading,
    openRedeemModal,
    closeRedeemModal,
    redeem,

    comments,
    commentLoading,
    addNewComment,
    editComment,
    deleteComment,

    onPageText,
  };

  return <DocsCtx.Provider value={value}>{children}</DocsCtx.Provider>;
}
