// src/app/docs-view/[id]/DocsViewProvider.tsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DocDetail, RelatedLite } from "@/services/docsService";
import { fetchDocDetail } from "@/services/docsService";

type Ctx = {
  loading: boolean;
  error?: string | null;
  detail?: DocDetail;
  related: RelatedLite[];

  // viewer state
  page: number;
  setPage: (p: number) => void;
  numPages: number;
  setNumPages: (n: number) => void;
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;

  // search
  query: string;
  setQuery: (q: string) => void;
  hits: number[];
  goNextHit: () => void;
  goPrevHit: () => void;

  // premium flow
  redeemed: boolean;
  redeem: () => void;

  // text cache
  onPageText: (pageNumber: number, text: string) => void;
};

const DocsCtx = createContext<Ctx | null>(null);
export const useDocsView = () => {
  const v = useContext(DocsCtx);
  if (!v) throw new Error("useDocsView must be inside DocsViewProvider");
  return v;
};

export function DocsViewProvider({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DocDetail | undefined>();
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchDocDetail(id);
        if (!mounted) return;
        setDetail(data.detail);
        setRelated(data.related);
        setNumPages(data.detail.pageCount); // sẽ được cập nhật lại bởi react-pdf khi loadSuccess
        setPage(1);
        setQuery("");
        setHits([]);
        setHitIndex(0);
        setRedeemed(!data.detail.isPremium); // free → xem ngay; premium → cần redeem
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const zoomIn = () => setScale((s) => Math.min(3, s + 0.1));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.1));

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
      if (t && t.includes(norm)) all.push(p);
    }
    setHits(all);
    if (all.length) {
      // chọn gần current page
      const idx = all.findIndex((p) => p >= page);
      setHitIndex(idx >= 0 ? idx : 0);
      if (all[0] !== page) setPage(all[idx >= 0 ? idx : 0]);
    } else {
      setHitIndex(0);
    }
  };

  useEffect(() => {
    recomputeHits(query);
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

  const redeem = () => setRedeemed(true);

  const value: Ctx = {
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
    redeemed,
    redeem,
    onPageText,
  };

  return <DocsCtx.Provider value={value}>{children}</DocsCtx.Provider>;
}
