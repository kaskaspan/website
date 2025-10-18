"use client";
import { Button } from "@/components/ui/button";
import { Globe } from "@/components/ui/globe";
import { VideoText } from "@/components/ui/video-text";
import { PageLoading } from "@/components/ui/loading";
import {
  OfflineDetector,
  OfflinePage,
  useNetworkStatus,
} from "@/components/ui/offline-detector";
import { SimpleAnalytics } from "@/components/analytics/SimpleAnalytics";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LogoutButton } from "@/components/auth/LogoutButton";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SmoothCursorDemo() {
  return (
    <>
      <span className="hidden md:block">Move your mouse around</span>
      <span className="block md:hidden">Tap anywhere to see the cursor</span>
    </>
  );
}

export function VideoTextDemo() {
  return (
    <div className="relative h-[200px] w-full max-w-4xl overflow-hidden">
      <VideoText src="https://cdn.magicui.design/ocean-small.webm">
        Kasper Pan
      </VideoText>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  // 页面加载完成后显示内容
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 2000); // 2秒加载时间

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    router.push("/about");
  };

  // 显示离线页面
  if (!isOnline) {
    return <OfflinePage />;
  }

  // 显示加载页面
  if (isPageLoading) {
    return <PageLoading />;
  }

  return (
    <ProtectedRoute>
      <div className="font-sans relative min-h-screen overflow-hidden">
        {/* 网络状态检测器 */}
        <OfflineDetector />
        {/* Analytics tracking */}
        <SimpleAnalytics page="/" />
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
          <div
            className="absolute w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000"
            style={{
              left:
                typeof window !== "undefined"
                  ? `${50 + (mousePosition.x / window.innerWidth) * 5}%`
                  : "50%",
              top:
                typeof window !== "undefined"
                  ? `${60 + (mousePosition.y / window.innerHeight) * 5}%`
                  : "60%",
            }}
          />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Logout Button */}
        <div className="absolute top-4 right-4 z-20">
          <LogoutButton />
        </div>

        {/* Content */}
        <div className="relative z-10 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
          <Globe className="absolute inset-0 mx-auto opacity-30" />
          <main className="flex flex-col gap-[32px] row-start-2 items-center relative z-10">
            <VideoTextDemo />
            <p className="text-lg text-white/90 backdrop-blur-sm bg-white/10 rounded-2xl px-6 py-3 border border-white/20">
              I&apos;m building my world.
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Button
                onClick={handleClick}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                about me
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                <Link href="/blog">blog</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                <Link href="/access">how to access</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white border-0"
              >
                <Link href="/analytics">analytics</Link>
              </Button>
            </div>
          </main>
          <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
        </div>
      </div>
    </ProtectedRoute>
  );
}
