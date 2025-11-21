// src/hooks/useReaderId.ts
"use client";

import { decodeJwtPayload, extractReaderId } from "@/utils/jwt";
import { useEffect, useState } from "react";

function getAuthTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const all = document.cookie || "";
  // dạng: Authorization=...; other=...
  const match = all.match(/(?:^|;\s*)Authorization=([^;]+)/);
  if (!match) return null;

  return decodeURIComponent(match[1]);
}

export function useReaderId() {
  const [readerId, setReaderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = getAuthTokenFromCookie();
      if (!token) {
        setReaderId(null);
        setLoading(false);
        return;
      }

      const payload = decodeJwtPayload(token);
      const rid = extractReaderId(payload);
      setReaderId(rid);
    } catch {
      setReaderId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    readerId,
    loading,
    isAuthenticated: !!readerId,
  };
}
