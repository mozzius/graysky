/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import {
  AppBskyFeedPost,
  type AppBskyFeedGetPosts,
  type ComAtprotoServerCreateSession,
} from "@atproto/api";
import { HeartIcon, MessageSquareIcon, RepeatIcon } from "lucide-react";

import background from "~/assets/graysky.png";
import { Hero } from "./hero";

export default async function LandingPage() {
  const posts = await getNicePosts();
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
      <section className="py-4">
        <h3 className="text-center text-base">
          What people are saying about Graysky
        </h3>
        <div className="mt-4 flex flex-row items-start gap-4 overflow-auto px-4">
          {posts.map((post) => (
            <a
              href={`https://bsky.app/profile/${
                post.author.handle
              }/post/${post.uri.split("/").pop()}`}
              key={post.uri}
              target="_blank"
              rel="noreferrer"
              className="flex w-64 shrink-0 flex-col gap-3 rounded border border-neutral-600 p-3 transition-colors hover:bg-neutral-800"
            >
              <div className="flex flex-row items-center">
                <img
                  src={post.author.avatar}
                  alt={`${post.author.handle}'s avatar`}
                  className="mr-3 h-8 w-8 shrink-0 rounded-full"
                />
                <div>
                  {post.author.displayName && (
                    <p className="line-clamp-1 text-sm font-medium">
                      {post.author.displayName}
                    </p>
                  )}
                  <p className="line-clamp-1 text-xs opacity-40">
                    @{post.author.handle}
                  </p>
                </div>
              </div>
              {AppBskyFeedPost.isRecord(post.record) && (
                <p className="text-sm opacity-90">{post.record.text}</p>
              )}
              <div className="flex w-3/4 flex-row items-center justify-between opacity-60">
                <div className="flex flex-row items-center gap-1.5">
                  <MessageSquareIcon color="white" size={14} />
                  <p className="text-xs">{post.replyCount ?? 0}</p>
                </div>
                <div className="flex flex-row items-center gap-1.5">
                  <RepeatIcon color="white" size={14} />
                  <p className="text-xs">{post.repostCount ?? 0}</p>
                </div>
                <div className="flex flex-row items-center gap-1.5">
                  <HeartIcon color="white" size={14} />
                  <p className="text-xs">{post.likeCount ?? 0}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

const nicePostsUris = [
  {
    url: "https://bsky.app/profile/thisfeedis.gay/post/3k7wqoxqcxk2f",
    atUri:
      "at://did:plc:hpu7oaq76zlbzi4scasp47bz/app.bsky.feed.post/3k7wqoxqcxk2f",
  },
  {
    url: "https://bsky.app/profile/osc.ac/post/3k7wpjkkxee27",
    atUri:
      "at://did:plc:esmiuxk53vmsllayghrq676w/app.bsky.feed.post/3k7wpjkkxee27",
  },
  {
    url: "https://bsky.app/profile/mrchee.se/post/3k7tp5ezy252b",
    atUri:
      "at://did:plc:35peeambfq2eu7u3wvkkatpk/app.bsky.feed.post/3k7tp5ezy252b",
  },
  {
    url: "https://bsky.app/profile/seanm4c.bsky.social/post/3k7rv6jlrqk2s",
    atUri:
      "at://did:plc:sgdtbaxx6xyzwbffvfqoyc4t/app.bsky.feed.post/3k7rv6jlrqk2s",
  },
  {
    url: "https://bsky.app/profile/ctartisan.bsky.social/post/3k7teitfu3g2b",
    atUri:
      "at://did:plc:erbbtcw5pqhjgjrhxgaw6nma/app.bsky.feed.post/3k7teitfu3g2b",
  },
  {
    url: "https://bsky.app/profile/pavlovforgoths.com/post/3k7rqpuypef2z",
    atUri:
      "at://did:plc:iniljto6o7z667rqvphp47km/app.bsky.feed.post/3k7rqpuypef2z",
  },
  {
    url: "https://bsky.app/profile/hazey.pet/post/3k7mryjxnfd2n",
    atUri:
      "at://did:plc:x5uw2ciejsr2ajn4rw2xxtdb/app.bsky.feed.post/3k7mryjxnfd2n",
  },
  {
    url: "https://bsky.app/profile/steffenrusten.bsky.social/post/3k7lh6j45qn2s",
    atUri:
      "at://did:plc:5dqtzkkxdyhfj7nhzp3iyxnu/app.bsky.feed.post/3k7lh6j45qn2s",
  },
  {
    url: "https://bsky.app/profile/maskedman.bsky.social/post/3k7hob6or5i2m",
    atUri:
      "at://did:plc:kbxa3w7o6oj4rlbitcdd2rib/app.bsky.feed.post/3k7hob6or5i2m",
  },
  {
    url: "https://bsky.app/profile/experimilk.bsky.social/post/3k7bp6ifoqh2e",
    atUri:
      "at://did:plc:yucu4m7ovhqulwtvcjpfil6g/app.bsky.feed.post/3k7bp6ifoqh2e",
  },
];

async function getNicePosts() {
  const res1 = await fetch(
    "https://bsky.social/xrpc/com.atproto.server.createSession",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: process.env.BSKY_EMAIL!,
        password: process.env.BSKY_PASSWORD!,
      } satisfies ComAtprotoServerCreateSession.InputSchema),
      next: {
        revalidate: 3600,
      },
    },
  );

  if (!res1.ok) {
    console.error(await res1.text());
    return [];
  }

  const { accessJwt } =
    (await res1.json()) as ComAtprotoServerCreateSession.OutputSchema;

  const params = new URLSearchParams(
    nicePostsUris.map((post) => ["uris", post.atUri]),
  );

  const res2 = await fetch(
    "https://bsky.social/xrpc/app.bsky.feed.getPosts?" + params.toString(),
    {
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${accessJwt}`,
      },
    },
  );

  if (!res2.ok) {
    console.error(await res2.text());
    return [];
  }

  const data = (await res2.json()) as AppBskyFeedGetPosts.OutputSchema;

  return data.posts;
}
