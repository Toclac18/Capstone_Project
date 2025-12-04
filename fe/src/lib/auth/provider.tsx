"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthInfo } from "@/types/server-auth";

export type AuthContextValue = AuthInfo & {
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialAuth,
  children,
}: {
  initialAuth: AuthInfo;
  children: ReactNode;
}) {
  const [auth] = useState<AuthInfo>(initialAuth);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...auth,
      loading: false,
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}
