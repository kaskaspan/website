"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAuthenticated,
  getCurrentUser,
  logout as authLogout,
  initializeAuth,
  type AuthState,
  type User,
} from "@/lib/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });
  const router = useRouter();

  const checkAuth = () => {
    const authenticated = isAuthenticated();
    const user = getCurrentUser();

    setAuthState({
      isAuthenticated: authenticated,
      user,
      isLoading: false,
    });
  };

  const logout = () => {
    authLogout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
    router.push("/login");
  };

  useEffect(() => {
    initializeAuth();
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        isLoading: authState.isLoading,
        logout,
        checkAuth,
      }}
    >
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
