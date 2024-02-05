/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

import { type BlogData } from "../utils";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const blogDataPromise = fetch(
    `https://graysky.app/blog/${params.slug}/info`,
  ).then((res) => res.json() as Promise<BlogData>);

  const imagePromise = fetch(
    new URL("~/assets/graysky.jpg", import.meta.url),
  ).then((res) => res.arrayBuffer());

  const [blogData, image] = await Promise.all([blogDataPromise, imagePromise]);

  const formatter = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  });

  return new ImageResponse(
    (
      <div tw="w-full h-full flex">
        {image && (
          <img // @ts-expect-error img behaves differently here
            src={image}
            height="1200"
            width="630"
            style={{ objectFit: "cover" }}
            alt=""
          />
        )}
        <div tw="p-8 absolute flex bottom-0 w-full left-0 justify-end h-full bg-neutral-950/20">
          <h1 tw="text-4xl font-bold">{blogData.title}</h1>
          <p tw="text-lg">
            {formatter.format(new Date(blogData.date))} - by {blogData.author}
          </p>
        </div>
      </div>
    ),
    { ...size },
  );
}
