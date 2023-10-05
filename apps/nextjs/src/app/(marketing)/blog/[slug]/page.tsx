import { Header } from "../../_components/header";
import { getAllPosts, getPostById } from "../utils";

export default async function BlogPost({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const { html, title } = await getPostById(slug);
  return (
    <article>
      <Header title={title} />
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className="container mx-auto mt-8 max-w-4xl px-4"
      />
    </article>
  );
}

// This function can statically allow nextjs to find all the posts that you
// have made, and statically generate them
export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post) => ({
    slug: post.id,
  }));
}

// Set the title of the page to be the post title, note that we no longer use
// e.g. next/head in app dir, and this can be async just like the server
// component
export async function generateMetadata({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const { title } = await getPostById(slug);
  return {
    title,
  };
}
