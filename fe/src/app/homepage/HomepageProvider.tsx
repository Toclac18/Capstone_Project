"use client";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  mockReader,
  mockOrganizations,
  mockSavedLists,
  mockLibraryDocs,
  mockContinueReading,
  mockBestForYou,
} from "@/mock/homepage.mock";

export type ReaderLite = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
};

export type OrganizationLite = { id: string; name: string; slug?: string };
export type SavedListLite = { id: string; name: string };
export type DocumentLite = {
  id: string;
  title: string;
  subject?: string;
  pageCount?: number;
  owned?: boolean;
};

type Ctx = {
  reader?: ReaderLite;
  orgs: OrganizationLite[];
  savedLists: SavedListLite[];
  libraryDocs: DocumentLite[];
  continueReading: DocumentLite[];
  bestForYou: DocumentLite[];
  q: string;
  setQ: (v: string) => void;
  onToggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
};

const HomepageCtx = createContext<Ctx | null>(null);
export const useHomepage = () => {
  const ctx = useContext(HomepageCtx);
  if (!ctx) throw new Error("useHomepage must be used within HomepageProvider");
  return ctx;
};

export function HomepageProvider({ children }: { children: React.ReactNode }) {
  const [reader, setReader] = useState<ReaderLite>();
  const [orgs, setOrgs] = useState<OrganizationLite[]>([]);
  const [savedLists, setSavedLists] = useState<SavedListLite[]>([]);
  const [libraryDocs, setLibraryDocs] = useState<DocumentLite[]>([]);
  const [continueReading, setContinueReading] = useState<DocumentLite[]>([]);
  const [bestForYou, setBestForYou] = useState<DocumentLite[]>([]);
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    setReader(mockReader);
    setOrgs(mockOrganizations);
    setSavedLists(mockSavedLists);
    setLibraryDocs(mockLibraryDocs);
    setContinueReading(mockContinueReading);
    setBestForYou(mockBestForYou);
  }, []);

  const filteredContinue = useMemo(() => {
    const search = q.toLowerCase();
    return continueReading.filter(
      (d) =>
        d.title.toLowerCase().includes(search) ||
        (d.subject ?? "").toLowerCase().includes(search),
    );
  }, [continueReading, q]);

  const filteredBest = useMemo(() => {
    const search = q.toLowerCase();
    return bestForYou.filter(
      (d) =>
        d.title.toLowerCase().includes(search) ||
        (d.subject ?? "").toLowerCase().includes(search),
    );
  }, [bestForYou, q]);

  const onToggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isSaved = (id: string) => saved.has(id);

  return (
    <HomepageCtx.Provider
      value={{
        reader,
        orgs,
        savedLists,
        libraryDocs,
        continueReading: filteredContinue,
        bestForYou: filteredBest,
        q,
        setQ,
        onToggleSave,
        isSaved,
      }}
    >
      {children}
    </HomepageCtx.Provider>
  );
}
