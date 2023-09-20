import Image from "next/image";

import background from "~/assets/graysky.png";
import { Hero } from "./hero";

export default async function LandingPage() {
  return (
    <div className="min-h-screen w-full" id="top">
      <div className="relative w-full bg-neutral-600 px-4 py-1">
        <p className="container mx-auto max-w-4xl text-center text-xs font-light">
          Graysky is <b>not</b> available on the{" "}
          <a href="#" className="underline">
            App Store
          </a>{" "}
          and the{" "}
          <a href="#" className="underline">
            Play Store
          </a>
          !
        </p>
      </div>
      <nav className="sticky top-0 z-20 h-14 w-full border-b border-neutral-600 backdrop-blur-xl backdrop-saturate-[120%]">
        <div className="container mx-auto flex h-full max-w-4xl flex-row items-center justify-between gap-4 px-4">
          <a href="#top">
            <h1 className="text-lg font-medium">Graysky</h1>
          </a>
          <div className="hidden flex-row items-center gap-4 sm:flex">
            <a className="text-sm hover:underline" href="#features">
              Features
            </a>
            <a className="text-sm hover:underline" href="#features">
              Something
            </a>
            <a className="text-sm hover:underline" href="#features">
              FAQ
            </a>
            <a
              className="ml-2 rounded border px-3 py-1.5 text-sm transition-colors duration-200 ease-in-out hover:bg-neutral-700"
              href="#download"
            >
              Download
            </a>
          </div>
        </div>
      </nav>
      <header
        id="top"
        className="relative flex min-h-[400px] w-full items-center overflow-hidden"
      >
        <Image
          src={background}
          className="absolute h-full w-full object-cover brightness-50 filter"
          alt="stormy gray clouds"
        />
        <Hero />
      </header>
      <section>{/* nice posts */}</section>
      <section>{/*  */}</section>
    </div>
  );
}

// async function getNicePosts() {

// const res1 = await fetch(
//   "https://bsky.social/xrpc/com.atproto.server.createSession",
//   {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       identifier: process.env.BSKY_EMAIL!,
//       password: process.env.BSKY_PASSWORD!,
//     } satisfies ComAtprotoServerCreateSession.InputSchema),
//   },
// );
// const { accessJwt } =
//   (await res1.json()) as ComAtprotoServerCreateSession.OutputSchema;

// }
