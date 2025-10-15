"use client";
import { Button } from "@/components/ui/button";
import { Globe } from "@/components/ui/globe";
import { VideoText } from "@/components/ui/video-text";

import Link from "next/link";
import { useRouter } from "next/navigation";

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

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <nav>
          <Link href="/blog">Blog</Link>
          <a href="/contact">Contact</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
export default function Home() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/about");
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 relative">
      <Globe className="absolute inset-0 mx-auto" />
      <main className="flex flex-col gap-[32px] row-start-2 items-center relative z-10">
        <VideoTextDemo />
        {/* <h2 className="text-4xl font-bold">Kasper Pan</h2> */}
        {/* <h2 className="text-4xl font-bold">Kasper Pan</h2> */}

        <p className="text-lg text-shadow-blue-500">
          I&apos;m building my world.
        </p>
        <div className="flex gap-4">
          <Button onClick={handleClick}>about me</Button>
          <Button asChild variant="outline">
            <Link href="/blog">blog</Link>
          </Button>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center"></footer>
    </div>
  );
}
