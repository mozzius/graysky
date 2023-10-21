import { type StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import Link from "next/link";

import poweredByTenor from "./tenor.svg";

export const metadata = {
  title: "GIF - Graysky",
  description: "If you send this link via Graysky, you get a nice preview",
};

export default function GifScreen({
  params,
  searchParams,
}: {
  params: { tenor: string[] };
  searchParams: { title?: string };
}) {
  const tenorUrl = `https://media.tenor.com/${params.tenor.join("/")}`;
  const title = searchParams.title
    ? decodeURIComponent(searchParams.title)
    : "GIF";

  return (
    <main className="grid min-h-screen w-full place-items-center bg-neutral-900">
      <div className="container flex w-full max-w-2xl flex-col items-center gap-4 p-4">
        <video
          src={tenorUrl}
          aria-description={title}
          autoPlay
          loop
          muted
          playsInline
          className="max-h-[80vh] rounded bg-neutral-800"
        />
        <div className="flex w-full max-w-xl flex-row items-center justify-between rounded bg-neutral-800 px-4 py-2">
          <h1 className="text-lg">{title}</h1>
          <Image
            src={poweredByTenor as StaticImport}
            alt="Powered by Tenor"
            height={32}
            className="mt-2 sm:mt-0"
          />
        </div>
        <div className="flex w-full max-w-xl flex-col gap-8 rounded px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p>Want to view and post GIFs? Get Graysky for iOS and Android!</p>
          <div className="flex shrink-0 flex-row items-center justify-center gap-2 max-sm:w-full">
            <Link
              className="w-max rounded bg-neutral-800 px-4 py-1 transition-colors hover:bg-neutral-700"
              href="/download"
            >
              Download
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
