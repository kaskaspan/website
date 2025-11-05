"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SimpleAnalytics } from "@/components/analytics/SimpleAnalytics";

export default function Access() {
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

  return (
      <div className="font-sans relative min-h-screen overflow-hidden">
        {/* Analytics tracking */}
        <SimpleAnalytics page="/access" />
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

        {/* Content */}
        <div className="relative z-10 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
          <main className="flex flex-col gap-[32px] row-start-2 items-center max-w-4xl">
            <div className="text-center">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
                How to Access
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-8" />
            </div>

            <div className="text-lg space-y-6 text-white/90 backdrop-blur-sm bg-white/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-4">
                🌐 Website Access Information
              </h2>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-purple-400 font-semibold">
                    Website URL:
                  </span>
                  <code className="bg-black/30 px-3 py-1 rounded text-blue-400 font-mono">
                    https://kasper.build
                  </code>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-purple-400 font-semibold">
                    Alternative URL:
                  </span>
                  <code className="bg-black/30 px-3 py-1 rounded text-blue-400 font-mono">
                    https://www.kasper.build
                  </code>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <h3 className="text-xl font-semibold text-white">
                  📱 How to Access:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-white/80">
                  <li>Open your web browser (Chrome, Firefox, Safari, etc.)</li>
                  <li>
                    Type{" "}
                    <code className="bg-black/30 px-2 py-1 rounded text-blue-400 font-mono">
                      kasper.build
                    </code>{" "}
                    in the address bar
                  </li>
                  <li>Press Enter or click Go</li>
                  <li>Bookmark the page for easy future access</li>
                </ol>
              </div>

              <div className="mt-6 space-y-3">
                <h3 className="text-xl font-semibold text-white">💡 Tips:</h3>
                <ul className="list-disc list-inside space-y-2 text-white/80">
                  <li>
                  You can access this website from any device (computer, phone,
                  tablet)
                  </li>
                  <li>The website is mobile-friendly and responsive</li>
                  <li>Make sure you have an internet connection</li>
                <li>If the site doesn&apos;t load, try refreshing the page</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap justify-center">
              <Link
                href="/"
                className="group relative px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              >
                <span className="relative z-10">🏠 Back to Home</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
              </Link>
              <Link
                href="/about"
                className="group relative px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              >
                <span className="relative z-10">👤 About Me</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
              </Link>
            </div>
          </main>

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
        </div>
      </div>
  );
}
