"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type DocumentLite = {
  id: string;
  title: string;
  subject?: string;
  pageCount?: number;
  owned?: boolean;

  // NEW fields (aligns with DocCard & mock data)
  orgId?: string;
  orgName?: string;
  viewCount: number;
  isPremium: boolean;
  points?: string;

  specialization: string;
  upvote_counts: number;
  downvote_counts: number;
  vote_scores: number;
  uploader: string;
  thumbnail: string;
};

type SpecGroup = { name: string; items: DocumentLite[] };

type HomepageCtx = {
  continueReading: DocumentLite[];
  topUpvoted: DocumentLite[];
  specGroups: SpecGroup[];
  loading: boolean;
  q: string;
  setQ: (v: string) => void;
};

const Ctx = createContext<HomepageCtx | null>(null);
export const useHomepage = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHomepage must be used within HomepageProvider");
  return ctx;
};

// Normalize any backend shape into our DocumentLite
function normalizeDoc(d: any): DocumentLite {
  const up = d?.upvote_counts ?? d?.upvotes ?? 0;
  const down = d?.downvote_counts ?? d?.downvotes ?? 0;

  const isPremium = !!d?.isPremium;
  const rawPoints =
    d?.points !== undefined && d?.points !== null
      ? String(d.points)
      : undefined;

  return {
    id: String(d?.id ?? ""),
    title: String(d?.title ?? ""),
    subject: d?.subject,
    pageCount: typeof d?.pageCount === "number" ? d.pageCount : undefined,
    owned: !!d?.owned,

    orgId: d?.orgId ?? d?.org_id,
    orgName: d?.orgName ?? d?.org_name ?? "—",
    viewCount:
      typeof d?.viewCount === "number"
        ? d.viewCount
        : typeof d?.views === "number"
          ? d.views
          : 0,
    isPremium,
    // only expose points when premium
    points: isPremium ? rawPoints : undefined,

    specialization: String(d?.specialization ?? ""),
    upvote_counts: up,
    downvote_counts: down,
    vote_scores: typeof d?.vote_scores === "number" ? d.vote_scores : up - down,
    uploader: String(d?.uploader ?? ""),
    thumbnail: String(d?.thumbnail ?? ""),
  };
}

export function HomepageProvider({ children }: { children: React.ReactNode }) {
  const [continueReading, setContinueReading] = useState<DocumentLite[]>([]);
  const [topUpvoted, setTopUpvoted] = useState<DocumentLite[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // If you merged APIs but kept this endpoint path, no change needed here.
        const res = await fetch("/api/homepage", { cache: "no-store" });
        const data = await res.json();

        if (!alive) return;

        const cr = Array.isArray(data?.continueReading)
          ? data.continueReading.map(normalizeDoc)
          : [];
        const tu = Array.isArray(data?.topUpvoted)
          ? data.topUpvoted.map(normalizeDoc)
          : [];
        const groups = Array.isArray(data?.specializations)
          ? data.specializations.map((g: any) => ({
              name: String(g?.name ?? ""),
              items: Array.isArray(g?.items) ? g.items.map(normalizeDoc) : [],
            }))
          : [];

        setContinueReading(cr);
        setTopUpvoted(tu);
        setSpecGroups(groups);
      } catch (e) {
        console.error("fetch /api/homepage failed", e);
        if (alive) {
          setContinueReading([]);
          setTopUpvoted([]);
          setSpecGroups([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Ctx.Provider
      value={{ continueReading, topUpvoted, specGroups, loading, q, setQ }}
    >
      {children}
    </Ctx.Provider>
  );
}
