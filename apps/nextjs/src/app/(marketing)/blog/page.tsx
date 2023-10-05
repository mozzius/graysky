import fs from "node:fs/promises";
import path from "node:path";

import { Header } from "../_components/header";

export default async function BlogIndexPage() {
  // const posts = await fs.readdir(path.join(__dirname, "(posts)"));
  return (
    <>
      <Header title="Blog" />
      {process.cwd()}
      {__dirname}
      {/* {posts.map((post, i) => (
        <pre key={i}>{JSON.stringify(post, null, 2)}</pre>
      ))} */}
    </>
  );
}
