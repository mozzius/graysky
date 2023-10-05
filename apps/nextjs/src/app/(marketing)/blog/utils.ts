import fs from "fs";
import { join } from "path";
import rehypeShiki from "@leafac/rehype-shiki";
import matter from "gray-matter";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import * as shiki from "shiki";
import { unified } from "unified";
import { z } from "zod";

// cache the creation of the markdown parser
let p: ReturnType<typeof getParserPre> | undefined;

async function getParserPre() {
  return (
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(remarkGfm)
      // @ts-expect-error types are wrong
      .use(rehypeShiki, {
        highlighter: await shiki.getHighlighter({ theme: "dark-plus" }),
      })
      .use(rehypeStringify)
      .use(rehypeSlug)
  );
}

function getParser() {
  if (!p) {
    p = getParserPre().catch((e) => {
      p = undefined;
      throw e;
    });
  }
  return p;
}

export async function getPostById(slug: string) {
  const fullPath = join(process.cwd(), "src", "posts", `${slug}.md`);
  const { data, content } = matter(
    await fs.promises.readFile(fullPath, "utf8"),
  );

  const parser = await getParser();
  const html = await parser.process(content);

  const schema = z.object({
    title: z.string(),
    author: z.string(),
    date: z.date(),
  });

  const parsed = schema.parse(data);

  return {
    id: slug,
    ...parsed,
    html: html.value.toString(),
  };
}

export async function getAllPosts() {
  console.log();
  const posts = await Promise.all(
    fs
      .readdirSync(join(process.cwd(), "src", "posts"))
      .map((file) => getPostById(file.replace(/\.md$/, ""))),
  );
  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}
