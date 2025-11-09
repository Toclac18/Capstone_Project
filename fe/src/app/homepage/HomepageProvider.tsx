"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type DocumentLite = {
  id: string;
  title: string;
  subject?: string;
  pageCount?: number;
  owned?: boolean;
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
        const res = await fetch("/api/homepage/me", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setContinueReading(data.continueReading ?? []);
        setTopUpvoted(data.topUpvoted ?? []);
        setSpecGroups(data.specializations ?? []);
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
