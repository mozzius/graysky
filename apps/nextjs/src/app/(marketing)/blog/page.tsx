import Image from "next/image";
import Link from "next/link";

import background from "~/assets/graysky.png";
import { Header } from "../_components/header";
import { getAllPosts } from "./utils";

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  });
  return (
    <>
      <Header title="Blog" />
      <div className="container mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 px-4 md:grid-cols-2">
        {posts.map((post) => {
          const { id, date, title, author } = post;
          return (
            <Link
              key={id}
              href={`/blog/${id}`}
              className="group relative block overflow-hidden rounded border border-neutral-600 bg-neutral-900"
            >
              <Image
                src={background}
                className="absolute h-16 w-full object-cover brightness-50 filter"
                alt="stormy gray clouds"
              />
              <div className="absolute top-8 z-10 h-8 w-full bg-gradient-to-b from-transparent to-neutral-900" />
              <div className="relative z-20 px-2 pb-2 pt-10 transition-colors group-hover:bg-neutral-950/70">
                <h3 className="text-2xl font-bold group-hover:underline">
                  {title}
                </h3>
                <p className="text-sm text-neutral-400">
                  <time dateTime={date.toISOString().slice(0, 10)}>
                    {formatter.format(new Date(date))}
                  </time>{" "}
                  - by @{author}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
