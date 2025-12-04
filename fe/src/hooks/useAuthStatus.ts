// src/hooks/useAuthStatus.ts
"use client";

import { useAuthContext } from "@/lib/auth/provider";

export function useAuthStatus() {
  const { isAuthenticated, loading } = useAuthContext();
  return { isAuthenticated, loading };
}
