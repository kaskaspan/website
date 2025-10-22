"use client";
import Link from "next/link";
import { ShineBorder } from "@/components/ui/shine-border";
import { useEffect, useState } from "react";

export default function Blog() {
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
  const blogPosts = [
    {
      id: 1,
      title: "My First Blog Post",
      date: "October 10, 2025",
      excerpt:
        "This is my first blog post. I'm excited to share my thoughts with the world.",
    },
    {
      id: 2,
      title: "The 5 day of building my world",
      date: "October 11, 2025",
      excerpt:
        "I am Kasper, and I am building my world, exploring the infinite possibilities of technology and creativity.",
    },
    {
      id: 4,
      title: "Minecraft",
      date: "October 22, 2025",
      excerpt: "Another interesting blog post about Minecraft.",
    },
  ];

  return (
    <div className="font-sans relative min-h-screen overflow-hidden">
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
        <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start max-w-4xl">
          <div className="text-center sm:text-left">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              My Blog
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto sm:mx-0 mb-8" />
          </div>

          <div className="space-y-6 w-full">
            {blogPosts.map((post) => (
              <ShineBorder
                key={post.id}
                shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                borderWidth={5}
                className="rounded-lg"
              >
                <article className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all border border-white/20">
                  <h2 className="text-2xl font-bold mb-2 text-white">
                    {post.title}
                  </h2>
                  <p className="text-white/70 text-sm mb-4">{post.date}</p>
                  <p className="text-white/90 mb-4">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.id}`}
                    className="group relative px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
                  >
                    <span className="relative z-10">Read more</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
                  </Link>
                </article>
              </ShineBorder>
            ))}
          </div>

          <Link
            href="/"
            className="group relative px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
          >
            <span className="relative z-10">Back to Home</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
          </Link>
        </main>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => {
            // Use a more precise deterministic seed to avoid hydration mismatch
            const seed = i * 0.1;
            const left =
              Math.round((Math.sin(seed) * 0.5 + 0.5) * 100 * 100) / 100;
            const top =
              Math.round((Math.cos(seed) * 0.5 + 0.5) * 100 * 100) / 100;
            const animationDelay =
              Math.round((Math.sin(seed * 2) * 0.5 + 0.5) * 3 * 1000) / 1000;
            const animationDuration =
              Math.round((2 + (Math.cos(seed * 3) * 0.5 + 0.5) * 3) * 1000) /
              1000;

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
      </div>
    </div>
  );
}
