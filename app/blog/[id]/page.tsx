import { notFound } from "next/navigation";
import BlogPostClient from "./client";

const blogPosts = [
  {
    id: 1,
    title: "My First Blog Post",
    date: "October 10, 2025",
    excerpt:
      "This is my first blog post. I'm excited to share my thoughts with the world.",
    h1: "Strong Beer",
    content: `
      here is a fun poem:
      Strong Beer
      “What do you think
The bravest drink
Under the sky?”
“Strong beer,” said I.

“There’s a place for everything,
Everything, anything,
There’s a place for everything
Where it ought to be:
For a chicken, the hen’s wing;
For poison, the bee’s sting;
For almond-blossom, Spring;
A beerhouse for me.”

“There’s a prize for everyone,
Everyone, anyone,
There’s a prize for everyone,
Whoever he may be:
Crags for the mountaineer,
Flags for the Fusilier,
For English poets, beer!
Strong beer for me!”

“Tell us, now, how and when
We may find the bravest men?”
“A sure test, an easy test:
Those that drink beer are the best,
Brown beer strongly brewed,
English drink and English food.”

Oh, never choose as Gideon chose
By the cold well, but rather those
Who look on beer when it is brown,
Smack their lips and gulp it down.
Leave the lads who tamely drink
With Gideon by the water brink,
But search the benches of the Plough,
The Tun, the Sun, the Spotted Cow,
For jolly rascal lads who pray,
Pewter in hand, at close of day,
“Teach me to live that I may fear
The grave as little as my beer.” `,
  },
  {
    id: 2,
    title: "Building My Website",
    date: "all the time",
    excerpt:
      "A journey of creating my personal website using Next.js and modern web technologies.",
    content: `
      Building a personal website has been an incredible learning experience. I chose Next.js as my framework 
      because of its powerful features and excellent developer experience.
      
      The journey involved learning about:
      - React and modern JavaScript
      - Server-side rendering and static site generation
      - Responsive design and CSS
      - Deployment and hosting
      
      I'm proud of what I've built so far, and I'm excited to continue improving it!
    `,
  },
  {
    id: 3,
    title: "The 3 day of building my world",
    date: "October 11 , 2025",
    excerpt:
      "I am Kasper, and I am building my world, exploring the infinite possibilities of technology and creativity.",
    content: `
      Nothing special so far, and I'm excited to continue improving it!
    `,
  },
];

export default function BlogPost({ params }: { params: { id: string } }) {
  const post = blogPosts.find((p) => p.id === parseInt(params.id));

  if (!post) {
    notFound();
  }

  return <BlogPostClient post={post} />;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    id: post.id.toString(),
  }));
}
