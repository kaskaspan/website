import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineBorder } from "@/components/ui/shine-border";

export default function Blog() {
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
  ];

  return (
    <div className="font-sans min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Blog</h1>
        <div className="space-y-6">
          {blogPosts.map((post) => (
            <ShineBorder
              key={post.id}
              shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
              borderWidth={5}
              className="rounded-lg"
            >
              <article className="bg-white dark:bg-gray-900 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
                <p className="text-gray-500 text-sm mb-4">{post.date}</p>
                <p className="text-gray-700 mb-4">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.id}`}
                  className="text-blue-500 hover:underline"
                >
                  Read more →
                </Link>
              </article>
            </ShineBorder>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/" className="text-blue-500 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
