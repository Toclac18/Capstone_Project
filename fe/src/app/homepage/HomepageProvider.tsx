"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { DocumentItem } from "@/types/documentResponse";

type SpecGroup = { name: string; items: DocumentItem[] };

type HomepageCtx = {
  continueReading: DocumentItem[];
  topUpvoted: DocumentItem[];
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

const THIS_YEAR = new Date().getFullYear();

const num = (v: any, fb = 0) =>
  typeof v === "number" && Number.isFinite(v)
    ? v
    : typeof v === "string" && v.trim() !== "" && !Number.isNaN(+v)
      ? +v
      : fb;

const str = (v: any, fb = "") => (typeof v === "string" ? v : fb);

const coalesce = <T,>(...vals: T[]) =>
  vals.find((x) => x !== undefined && x !== null);

function toDocumentItem(raw: any): DocumentItem {
  const isPremium = !!coalesce(raw?.isPremium, raw?.premium, false);

  const ptsRaw = isPremium
    ? coalesce(raw?.points, raw?.price, raw?.credits)
    : null;
  const pts = typeof ptsRaw === "number" ? ptsRaw : null;

  return {
    id: String(coalesce(raw?.id, raw?.docId, raw?._id, "")),
    title: str(coalesce(raw?.title, raw?.name), "Untitled"),
    orgName: str(coalesce(raw?.orgName, raw?.org_name, raw?.organization), "—"),
    domain: str(
      coalesce(raw?.domain, raw?.subjectDomain, raw?.topic),
      "General",
    ),
    specialization: str(
      coalesce(raw?.specialization, raw?.spec, raw?.category),
      "General",
    ),
    uploader: str(
      coalesce(raw?.uploader, raw?.author, raw?.owner, raw?.createdBy),
      "unknown",
    ),
    publicYear: num(coalesce(raw?.publicYear, raw?.year), THIS_YEAR),
    isPremium,
    points: pts,

    description: str(
      coalesce(
        raw?.description,
        raw?.desc,
        raw?.overview,
        raw?.abstract,
        raw?.summary_text,
        "",
      ),
      "",
    ),
    summarizations: {
      short: str(
        coalesce(
          raw?.summarizations?.short,
          raw?.summaries?.short,
          raw?.summary?.short,
          raw?.shortSummary,
          raw?.summary_short,
          "",
        ),
        "",
      ),
      medium: str(
        coalesce(
          raw?.summarizations?.medium,
          raw?.summaries?.medium,
          raw?.summary?.medium,
          raw?.summary,
          raw?.summaryContent,
          raw?.summary_content,
          "",
        ),
        "",
      ),
      detailed: str(
        coalesce(
          raw?.summarizations?.detailed,
          raw?.summaries?.detailed,
          raw?.summary?.detailed,
          raw?.longSummary,
          raw?.summary_long,
          "",
        ),
        "",
      ),
    },

    upvote_counts: num(
      coalesce(raw?.upvote_counts, raw?.upvotes, raw?.likes),
      0,
    ),
    downvote_counts: num(
      coalesce(raw?.downvote_counts, raw?.downvotes, raw?.dislikes),
      0,
    ),
    thumbnail: str(
      coalesce(raw?.thumbnail, raw?.thumb, raw?.cover, raw?.image),
      "data:image/svg+xml,",
    ),
  };
}

export function HomepageProvider({ children }: { children: React.ReactNode }) {
  const [continueReading, setContinueReading] = useState<DocumentItem[]>([]);
  const [topUpvoted, setTopUpvoted] = useState<DocumentItem[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/homepage", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!alive) return;

        const cr: DocumentItem[] = Array.isArray(data?.continueReading)
          ? data.continueReading.map(toDocumentItem)
          : [];

        const tu: DocumentItem[] = Array.isArray(data?.topUpvoted)
          ? data.topUpvoted.map(toDocumentItem)
          : [];

        const rawGroups = Array.isArray(data?.specGroups)
          ? data.specGroups
          : Array.isArray(data?.specializations)
            ? data.specializations
            : [];

        const groups: SpecGroup[] = rawGroups.map((g: any) => ({
          name: String(g?.name ?? ""),
          items: Array.isArray(g?.items) ? g.items.map(toDocumentItem) : [],
        }));

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
