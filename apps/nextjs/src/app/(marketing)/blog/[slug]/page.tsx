/* eslint-disable jsx-a11y/heading-has-content */
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";

import { Header } from "../../_components/header";
import { getAllPosts, getPostById } from "../utils";

export default async function BlogPost({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const { content, title } = await getPostById(slug);
  return (
    <article>
      <Header title={title} />
      <div className="container mx-auto mt-8 max-w-4xl px-4">
        <MDXRemote
          source={content}
          components={{
            a: ({ href, ref: _, ...props }) =>
              href ? (
                <Link href={href} {...props} className="hover" />
              ) : (
                props.children
              ),
            h1: (props) => (
              <h1
                {...props}
                className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
              />
            ),
            h2: (props) => (
              <h2
                {...props}
                className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
              />
            ),
            h3: (props) => (
              <h3
                {...props}
                className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight"
              />
            ),
            h4: (props) => (
              <h4
                {...props}
                className="mt-6 scroll-m-20 text-xl font-semibold tracking-tight"
              />
            ),
            p: (props) => (
              <p {...props} className="leading-7 [&:not(:first-child)]:mt-6" />
            ),
            blockquote: (props) => (
              <blockquote {...props} className="mt-6 border-l-2 pl-6 italic" />
            ),
            ul: (props) => (
              <ul {...props} className="my-6 ml-6 list-disc [&>li]:mt-2" />
            ),
            code: (props) => (
              <code
                {...props}
                className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
              />
            ),
          }}
        />
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
  params: { slug },
}: {
  params: { slug: string };
}) {
  const { title } = await getPostById(slug);
  return {
    title: title + " | Graysky Blog",
  };
}
