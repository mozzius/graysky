import fs from "fs";
import { join } from "path";
import matter from "gray-matter";
import { z } from "zod";

export async function getPostById(slug: string) {
  const fullPath = join(process.cwd(), "src", "posts", `${slug}.md`);
  const { data, content } = matter(
    await fs.promises.readFile(fullPath, "utf8"),
  );

  const schema = z.object({
    title: z.string(),
    author: z.string(),
    date: z.date(),
    draft: z.boolean().optional(),
    atUri: z.string().optional(),
  });

  const parsed = schema.parse(data);

  return {
    id: slug,
    ...parsed,
    content,
  };
}

export async function getAllPosts() {
  const posts = await Promise.all(
    fs
      .readdirSync(join(process.cwd(), "src", "posts"))
      .map((file) => getPostById(file.replace(/\.md$/, ""))),
  );
  return posts
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .filter(
      process.env.NODE_ENV === "production"
        ? (post) => !post.draft
        : () => true,
    );
}
