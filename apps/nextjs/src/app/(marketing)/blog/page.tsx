import fs from "fs/promises";

import { Header } from "../_components/header";

export default async function BlogIndexPage() {
  const posts = await fs.readdir("./(posts)");
  return (
    <>
      <Header title="Blog" />
      {posts.map((post) => (
        <pre>{JSON.stringify(post, null, 2)}</pre>
      ))}
    </>
  );
}
