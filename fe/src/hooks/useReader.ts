// src/hooks/useReader.ts
"use client";

import { useEffect, useState } from "react";

type MeResponse = {
  isAuthenticated: boolean;
  readerId: string | null;
  email: string | null;
  role: string | null;
};

export function useReader() {
  const [readerId, setReaderId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load auth info");
        }

        const data: MeResponse = await res.json();
        if (cancelled) return;

        setReaderId(data.readerId);
        setRole(data.role);
        setEmail(data.email);
      } catch {
        if (!cancelled) {
          setReaderId(null);
          setRole(null);
          setEmail(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    readerId,
    role,
    email,
    loading,
    isAuthenticated: !!readerId,
  };
}
