/* eslint-disable react/no-unknown-property */
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
  try {
    const blogDataPromise = fetch(
      `https://graysky.app/blog/${params.slug}/info`,
    ).then((res) => res.json() as Promise<BlogData>);

    const imagePromise = fetch(
      new URL("~/assets/graysky.jpg", import.meta.url),
    ).then((res) => res.arrayBuffer());

    const interRegularFontPromise = fetch(
      new URL("~/assets/fonts/Inter-Regular.ttf", import.meta.url),
    ).then((res) => res.arrayBuffer());

    const interBoldFontPromise = fetch(
      new URL("~/assets/fonts/Inter-Bold.ttf", import.meta.url),
    ).then((res) => res.arrayBuffer());

    const [blogData, image, interRegularFont, interBoldFont] =
      await Promise.all([
        blogDataPromise,
        imagePromise,
        interRegularFontPromise,
        interBoldFontPromise,
      ]);

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
              tw="w-full relative -top-1/2"
              alt=""
            />
          )}
          <div tw="bg-neutral-900 opacity-60 w-full h-full absolute top-0 left-0" />
          <div tw="p-16 absolute flex flex-col bottom-0 w-full left-0 justify-end h-full">
            <h1 tw="text-7xl font-bold text-white">{blogData.title}</h1>
            <p tw="text-4xl text-neutral-300">
              {formatter.format(new Date(blogData.date))} - by {blogData.author}
            </p>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: "Inter",
            data: interRegularFont,
            style: "normal",
            weight: 400,
          },
          {
            name: "Inter",
            data: interBoldFont,
            style: "normal",
            weight: 700,
          },
        ],
      },
    );
  } catch (err) {
    console.log(err);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
