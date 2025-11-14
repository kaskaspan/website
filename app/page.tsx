"use client";
import { Button } from "@/components/ui/button";
import { Globe } from "@/components/ui/globe";
import { VideoText } from "@/components/ui/video-text";
import { PageLoading } from "@/components/ui/loading";
import { OfflinePage, useNetworkStatus } from "@/components/ui/offline-detector";
import { SimpleAnalytics } from "@/components/analytics/SimpleAnalytics";
import { TypingAnimation } from "@/registry/magicui/typing-animation";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function VideoTextDemo() {
  return (
    <div className="relative h-48 w-full max-w-4xl overflow-hidden rounded-2xl sm:h-56 lg:h-64">
      <VideoText src="https://cdn.magicui.design/ocean-small.webm">
        Kasper Pan
      </VideoText>
    </div>
  );
}

function ProfilePhoto() {
  return null;
}

export default function Home() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
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
    <div className="font-sans relative min-h-screen min-h-[100dvh] overflow-hidden">
      {/* Analytics tracking */}
      <SimpleAnalytics page="/" />
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Floating orbs */}
        <div
          className="absolute h-64 w-64 animate-pulse rounded-full bg-purple-500/20 blur-3xl sm:h-80 sm:w-80 lg:h-96 lg:w-96"
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
          className="absolute h-56 w-56 animate-pulse rounded-full bg-blue-500/20 blur-3xl delay-1000 sm:h-72 sm:w-72 lg:h-80 lg:w-80"
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
          className="absolute h-48 w-48 animate-pulse rounded-full bg-indigo-500/20 blur-3xl delay-2000 sm:h-64 sm:w-64 lg:h-72 lg:w-72"
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
        <div className="absolute inset-0 hidden bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] sm:block lg:bg-[size:50px_50px]" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
      </div>

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        {[...Array(20)].map((_, i) => {
          // Use deterministic values to avoid hydration mismatch
          const seed = i * 0.1;
          const left =
            Math.round((Math.sin(seed) * 0.5 + 0.5) * 100 * 100) / 100;
          const top =
            Math.round((Math.cos(seed) * 0.5 + 0.5) * 100 * 100) / 100;
          const animationDelay =
            Math.round((Math.sin(seed * 2) * 0.5 + 0.5) * 3 * 100) / 100;
          const animationDuration =
            Math.round((2 + (Math.cos(seed * 3) * 0.5 + 0.5) * 3) * 100) / 100;

          return (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${animationDelay}s`,
                animationDuration: `${animationDuration}s`,
              }}
            />
          );
        })}
      </div>

      {/* Hidden Analytics Button - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-20">
        <div className="w-8 h-8 bg-transparent hover:bg-transparent cursor-pointer">
          <Link
            href="/analytics"
            className="block w-full h-full bg-transparent hover:bg-transparent"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
            }}
          >
            <span className="sr-only">Analytics</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 grid min-h-screen min-h-[100dvh] grid-rows-[16px_1fr_16px] items-center justify-items-center gap-12 px-6 pb-16 pt-8 sm:grid-rows-[20px_1fr_20px] sm:gap-14 sm:px-10 sm:pb-20 sm:pt-12 lg:gap-16 lg:px-16">
        <Globe className="absolute inset-0 mx-auto hidden opacity-30 lg:block" />
        <main className="relative z-10 row-start-2 flex w-full max-w-4xl flex-col items-center gap-10 sm:gap-12 lg:gap-14">
          <ProfilePhoto />
          <VideoTextDemo />
          <TypingAnimation
            className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-base text-white/90 backdrop-blur-sm sm:px-6 sm:py-4 sm:text-lg"
            speed={55}
            hideCursorAfterFinish
          >
            I&apos;m building my world.
          </TypingAnimation>
          <div className="flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button
              onClick={handleClick}
              className="w-full border-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 sm:w-auto"
            >
              about me
            </Button>
            <Button
              asChild
              className="w-full border-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 sm:w-auto"
            >
              <Link href="/blog">blog</Link>
            </Button>
            <Button
              asChild
              className="w-full border-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 sm:w-auto"
            >
              <Link href="/game">🎮 Play Game</Link>
            </Button>
            <Button
              asChild
              className="w-full border-0 bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700 sm:w-auto"
            >
              <Link href="/typing-game">⌨️ Typing Game</Link>
            </Button>
            <Button
              asChild
              className="w-full border-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 sm:w-auto"
            >
              <Link href="/access">how to access</Link>
            </Button>
          </div>
        </main>
        <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
      </div>
    </div>
  );
}
