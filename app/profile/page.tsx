"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="font-sans relative min-h-screen w-full flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="font-sans relative min-h-screen w-full overflow-y-auto overflow-x-hidden" style={{ minHeight: "100dvh" }}>
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Floating orbs */}
        <div
          className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            left:
              typeof window !== "undefined"
                ? `${20 + (mousePosition.x / window.innerWidth) * 10}%`
                : "20%",
            top:
              typeof window !== "undefined"
                ? `${10 + (mousePosition.y / window.innerHeight) * 10}%`
                : "10%",
          }}
        />
        <div
          className="absolute w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"
          style={{
            right:
              typeof window !== "undefined"
                ? `${20 + (mousePosition.x / window.innerWidth) * -10}%`
                : "20%",
            bottom:
              typeof window !== "undefined"
                ? `${20 + (mousePosition.y / window.innerHeight) * -10}%`
                : "20%",
          }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen w-full flex">
        {/* Main Content */}
        <div className="flex-1 w-full p-4 sm:p-6 md:p-8 lg:p-12">
          <main className="w-full max-w-4xl mx-auto">
            {/* Navigation */}
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-white/80 hover:border-white/40 hover:text-white transition"
              >
                <Home className="h-4 w-4" />
                <span>返回首页</span>
              </Link>
            </div>

            {/* Profile Card */}
            <Card className="bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 border-white/20 backdrop-blur-xl p-6 sm:p-8">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center mb-4 shadow-lg">
                  <UserRound className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                  {user?.username || "用户"}
                </h1>
                <p className="text-white/70 text-sm sm:text-base">
                  {user?.email || "未设置邮箱"}
                </p>
              </div>

              {/* User Info */}
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">用户名</span>
                    <span className="text-white font-semibold">{user?.username || "未设置"}</span>
                  </div>
                </div>
                {user?.email && (
                  <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">邮箱</span>
                      <span className="text-white font-semibold">{user.email}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-white/30 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                >
                  <Link href="/game" className="flex items-center justify-center gap-2">
                    🎮 游戏中心
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-white/30 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                >
                  <Link href="/typing-game" className="flex items-center justify-center gap-2">
                    ⌨️ 打字游戏
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 border-white/30 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                >
                  <Link href="/typing-analytics" className="flex items-center justify-center gap-2">
                    📊 打字分析
                  </Link>
                </Button>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="flex-1 border-white/30 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </Button>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

