"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface ModalPreviewDoc {
  id: string | number;
  title?: string;
  orgName?: string;
  org_name?: string;
  specialization?: string;
  publicYear?: number | string;
  uploader?: string;
  isPremium?: boolean;
  points?: number | null;
  thumbnail?: string;
  description?: string;
  summary?: string;
  summarizations?: {
    short?: string;
    medium?: string;
    detailed?: string;
  };
  pageCount?: number;
  viewCount?: number;
  views?: number;
  subject?: string;
  upvote_counts?: number;
  downvote_counts?: number;
  upvotes?: number;
  downvotes?: number;
  [k: string]: any;
}

type Ctx = {
  isOpen: boolean;
  doc: ModalPreviewDoc | null;
  open: (doc: ModalPreviewDoc) => void;
  close: () => void;
};

const ModalPreviewContext = createContext<Ctx | null>(null);

export function ModalPreviewProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<ModalPreviewDoc | null>(null);
  const isOpen = !!doc;

  const prevOverflow = useRef<string | null>(null);
  useEffect(() => {
    if (isOpen) {
      prevOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else if (prevOverflow.current !== null) {
      document.body.style.overflow = prevOverflow.current;
      prevOverflow.current = null;
    }
    return () => {
      if (prevOverflow.current !== null) {
        document.body.style.overflow = prevOverflow.current;
        prevOverflow.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDoc(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const open = useCallback((d: ModalPreviewDoc) => setDoc(d), []);
  const close = useCallback(() => setDoc(null), []);

  const value = useMemo<Ctx>(
    () => ({ isOpen, doc, open, close }),
    [isOpen, doc, open, close],
  );

  return (
    <ModalPreviewContext.Provider value={value}>
      {children}
    </ModalPreviewContext.Provider>
  );
}

export function useModalPreview() {
  const ctx = useContext(ModalPreviewContext);
  if (!ctx) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[ModalPreview] useModalPreview called outside <ModalPreviewProvider>",
      );
    }
    return {
      isOpen: false,
      doc: null,
      open: () => {},
      close: () => {},
    } as const;
  }
  return ctx;
}
