/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/heading-has-content */
import Link from "next/link";
import { Code } from "bright";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import { remarkHeadingId } from "remark-custom-heading-id";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  components?: React.ComponentProps<typeof MDXRemote>["components"];
}

export const Markdown = ({ content, components }: Props) => {
  return (
    <MDXRemote
      source={content}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkHeadingId],
          rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
        },
      }}
      components={{
        a: ({ href, ref: _, ...props }) =>
          href ? (
            <Link
              href={href}
              {...props}
              className="underline underline-offset-4"
            />
          ) : (
            props.children
          ),
        h1: ({ ref: _, ...props }) => (
          <h1
            {...props}
            className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
          />
        ),
        h2: ({ ref: _, ...props }) => (
          <h2
            {...props}
            className="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
          />
        ),
        h3: ({ ref: _, ...props }) => (
          <h3
            {...props}
            className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight"
          />
        ),
        h4: ({ ref: _, ...props }) => (
          <h4
            {...props}
            className="mt-6 scroll-m-20 text-xl font-semibold tracking-tight"
          />
        ),
        p: ({ ref: _, ...props }) => (
          <p {...props} className="leading-7 [&:not(:first-child)]:mt-6" />
        ),
        blockquote: ({ ref: _, ...props }) => (
          <blockquote {...props} className="mt-6 border-l-2 pl-6 italic" />
        ),
        ul: ({ ref: _, ...props }) => (
          <ul {...props} className="my-6 ml-6 list-disc [&>li]:mt-1.5" />
        ),
        pre: ({ ref: _, ...props }) => (
          <Code {...props} className="my-6" theme="github-dark" lineNumbers />
        ),
        img: ({ alt, ref: _, ...props }) => (
          <img
            {...props}
            alt={alt}
            className="mx-auto my-6 max-w-full rounded"
            loading="lazy"
          />
        ),
        ...components,
      }}
    />
  );
};
