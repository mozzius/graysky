import fs from "node:fs/promises";
import path from "node:path";

import { Header } from "../_components/header";

export default async function BlogIndexPage() {
  // const posts = await fs.readdir(path.join(__dirname, "(posts)"));
  return (
    <>
      <Header title="Blog" />
      <pre>
        <p>{process.cwd()}</p>
        <p>{__dirname}</p>
      </pre>
      {/* {posts.map((post, i) => (
        <pre key={i}>{JSON.stringify(post, null, 2)}</pre>
      ))} */}
    </>
  );
}
