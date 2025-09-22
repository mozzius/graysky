import { Suspense } from "react";
import Link from "next/link";
import { HomeIcon } from "lucide-react";

import { Header } from "../../_components/header";
import { Markdown } from "../../_components/markdown";
import { Spinner } from "../../_components/spinner";
import { getAllPosts, getPostById } from "../utils";
import { CommentSection } from "./comment-section";

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { content, title, date, author, atUri } = await getPostById(slug);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  });
  return (
    <article>
      <Header
        title={title}
        subtitle={`${formatter.format(date)} - by ${author}`}
      />
      <div className="row container mx-auto my-4 flex max-w-4xl items-center gap-4 px-4">
        <Link href="/">
          <HomeIcon className="h-4 w-4" />
        </Link>
        /
        <Link
          href="/blog"
          className="text-sm underline-offset-4 hover:underline"
        >
          Blog
        </Link>
        /<span className="text-sm">{title}</span>
      </div>
      <div className="container mx-auto mt-8 max-w-4xl px-4 pb-16">
        <Markdown content={content} />
        <hr className="my-8" />
        <Suspense fallback={<Spinner />}>
          <CommentSection uri={atUri} />
        </Suspense>
      </div>
    </article>
  );
}

export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post) => ({
    slug: post.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { title, author, date } = await getPostById(slug);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
  });
  return {
    title: title + " - Graysky",
    description: `${formatter.format(date)} - by ${author}`,
    openGraph: {
      title: title + " - Graysky",
      description: `${formatter.format(date)} - by ${author}`,
    },
  };
}
