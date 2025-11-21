"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getCurrentUser as getSupabaseUser,
  logout as supabaseLogout,
  isAuthenticated as supabaseIsAuthenticated,
  type AuthUser,
} from "@/lib/supabase/auth";
import type { User } from "@/lib/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
  }>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const authenticated = await supabaseIsAuthenticated();
      const authUser = await getSupabaseUser();

      if (authenticated && authUser) {
        // 转换为旧的 User 格式以保持兼容性
        const user: User = {
          id: authUser.id,
          username: authUser.username,
          email: authUser.email || "",
          avatar: authUser.avatar,
          loginTime: authUser.loginTime,
        };

        setAuthState({
          isAuthenticated: true,
          user,
          isLoading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("检查认证状态错误:", error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  };

  const logout = async () => {
    try {
      await supabaseLogout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
      router.push("/login");
    } catch (error) {
      console.error("登出错误:", error);
    }
  };

  useEffect(() => {
    checkAuth();

    // 监听 Supabase 认证状态变化
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await checkAuth();
      } else if (event === "SIGNED_OUT") {
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
  }
  return context;
}

