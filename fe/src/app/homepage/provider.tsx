"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { DocumentItem } from "@/types/document-homepage";
import {
  fetchHomepageSections,
  type HomepageSections,
} from "@/services/homepage.service";

import { toDocumentItem } from "@/lib/mappers/toDocumentItem";

// =============================
// Types
// =============================
type SpecGroup = {
  name: string;
  items: DocumentItem[];
};

type HomepageCtx = {
  continueReading: DocumentItem[];
  topUpvoted: DocumentItem[];
  specGroups: SpecGroup[];
  totalSpecGroups: number;
  hasMoreSpecs: boolean;
  loadMoreSpecs: () => void;

  loading: boolean;
  q: string;
  setQ: (v: string) => void;
};

const Ctx = createContext<HomepageCtx | null>(null);

export function useHomepage() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHomepage must be used within HomepageProvider");
  return ctx;
}

// =============================
// Provider Implementation
// =============================

const INITIAL_GROUPS_SHOW = 3;
const GROUPS_INCREMENT = 3;

export function HomepageProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  const [continueReading, setContinueReading] = useState<DocumentItem[]>([]);
  const [topUpvoted, setTopUpvoted] = useState<DocumentItem[]>([]);
  const [allSpecGroups, setAllSpecGroups] = useState<SpecGroup[]>([]);

  const [visibleGroupsCount, setVisibleGroupsCount] =
    useState(INITIAL_GROUPS_SHOW);

  const [q, setQ] = useState("");

  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? "";
  const str = (v: any, fb = "") => (typeof v === "string" ? v : fb);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const data: HomepageSections = await fetchHomepageSections();
        if (!alive) return;

        // 1. Continue Reading
        setContinueReading((data.continueReading ?? []).map(toDocumentItem));

        // 2. Top Upvoted
        setTopUpvoted((data.topUpvoted ?? []).map(toDocumentItem));

        // 3. Spec Groups
        const groups = (data.specGroups ?? []).map((g) => ({
          name: str(g.name, "General"),
          items: (g.items ?? []).map(toDocumentItem),
        }));

        setAllSpecGroups(groups);
      } catch (err) {
        console.error("Homepage load failed:", err);
        if (alive) {
          setContinueReading([]);
          setTopUpvoted([]);
          setAllSpecGroups([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [searchKey]);

  const visibleSpecGroups = useMemo(() => {
    return allSpecGroups.slice(0, visibleGroupsCount);
  }, [allSpecGroups, visibleGroupsCount]);

  const hasMoreSpecs = visibleGroupsCount < allSpecGroups.length;

  const loadMoreSpecs = () =>
    setVisibleGroupsCount((c) =>
      Math.min(c + GROUPS_INCREMENT, allSpecGroups.length),
    );

  return (
    <Ctx.Provider
      value={{
        continueReading,
        topUpvoted,
        specGroups: visibleSpecGroups,
        totalSpecGroups: allSpecGroups.length,
        hasMoreSpecs,
        loadMoreSpecs,
        loading,
        q,
        setQ,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
