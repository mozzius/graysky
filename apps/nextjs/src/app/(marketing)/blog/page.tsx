import Link from "next/link";

import { Header } from "../_components/header";
import { getAllPosts } from "./utils";

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  return (
    <>
      <Header title="Blog" />
      <ul>
        {posts.map((post) => {
          const { id, date, title } = post;
          return (
            <li key={id}>
              <Link href={`/posts/${id}`}>
                {date} - {title}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
