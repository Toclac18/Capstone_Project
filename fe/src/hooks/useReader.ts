// src/hooks/useReader.ts
"use client";

import { useAuthContext } from "@/lib/auth/provider";

export function useReader() {
  const { readerId, role, email, loading, isAuthenticated } = useAuthContext();

  return {
    readerId,
    role,
    email,
    loading,
    isAuthenticated,
  };
}
