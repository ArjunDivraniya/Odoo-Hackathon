"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMe, useLogout } from "@/features/auth/hooks/use-auth";
import type { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  const { data: meData, isLoading: meLoading } = useMe(!isAuthPage);
  const logoutMutation = useLogout();

  const user = meData ?? null;
  const hasToken =
    typeof window !== "undefined" && !!localStorage.getItem("accessToken");
  const isAuthenticated = !!user && !!hasToken;
  const isLoading = meLoading;

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    logoutMutation.mutate();
  }, [logoutMutation]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isAuthPage) {
      router.push("/auth/login");
    } else if (isAuthenticated && isAuthPage) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, isAuthPage, router, pathname]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
