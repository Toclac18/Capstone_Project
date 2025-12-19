"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { AuthInfo } from "@/types/server-auth";

export type AuthContextValue = AuthInfo & {
  loading: boolean;
  setAuthInfo: (next: AuthInfo) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialAuth,
  children,
}: {
  initialAuth: AuthInfo;
  children: ReactNode;
}) {
  const [auth, setAuth] = useState<AuthInfo>(initialAuth);

  // Update auth state when initialAuth changes (e.g., after router.refresh())
  useEffect(() => {
    setAuth(initialAuth);
  }, [initialAuth]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...auth,
      loading: false,
      setAuthInfo: setAuth,
    };
  }, [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}
