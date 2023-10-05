import Image from "next/image";
import {
  type AppBskyFeedGetPosts,
  type ComAtprotoServerCreateSession,
} from "@atproto/api";

import background from "~/assets/graysky.png";
import { env } from "~/env.mjs";
import { EmailInput } from "./_components/email-input";
import { Features } from "./_components/features";
import { Hero } from "./_components/hero";
import { Post } from "./_components/post";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: {
    error?: boolean;
    success?: boolean;
  };
}) {
  const posts = await getNicePosts();
  return (
    <>
      <header className="relative flex min-h-[400px] w-full items-center overflow-hidden">
        <Image
          src={background}
          className="absolute h-full w-full object-cover brightness-50 filter"
          alt="stormy gray clouds"
        />
        <Hero />
      </header>
      <section className="px-4 py-8">
        <h3 className="text-center text-xl font-medium">Features</h3>
        <Features />
      </section>
      <section>
        <h3 className="mt-4 px-4 text-center text-xl font-medium">
          What people are saying
        </h3>
        <div className="mt-4 flex flex-row items-start gap-4 overflow-auto px-4 pb-4">
          {posts.map((post) => (
            <Post data={post} key={post.uri} />
          ))}
        </div>
      </section>
      <section className="bg-neutral-950 px-4 py-8 text-white">
        <div className="container mx-auto max-w-2xl pb-8">
          <h3 className="mb-8 text-center text-xl font-medium">
            Frequently Asked Questions
          </h3>
          <h4 className="mt-4 font-medium">What&apos;s Graysky then?</h4>
          <p className="mt-2 max-w-xl text-sm opacity-70">
            It&apos;s an alternative client for Bluesky. Same content, more
            features.
          </p>
          <h4 className="mt-4 font-medium">Is that allowed?</h4>
          <p className="mt-2 max-w-xl text-sm opacity-70">
            More than allowed - it&apos;s encouraged! Bluesky&apos;s AT Protocol
            is designed with third-party developers in mind, and the Bluesky
            team has been tremendously supportive of this project.
          </p>
          <h4 className="mt-4 font-medium">What features does it have?</h4>
          <p className="mt-2 max-w-xl text-sm opacity-70">
            Inline translations, GIFs, and a thousand thoughtful quality of life
            improvements.
          </p>
          <h4 className="mt-4 font-medium">
            Is it safe to log in with my Bluesky account?
          </h4>
          <p className="mt-2 max-w-xl text-sm opacity-70">
            It is, but if you don&apos;t trust me you can create an App Password
            to restrict access how much access the app has to your account.
          </p>
        </div>
      </section>
      <section className="px-4 pb-10 pt-8">
        <div className="container mx-auto flex max-w-4xl flex-col items-center">
          <h3 className="px-4 pb-4 text-center text-xl font-medium">
            Get project updates!
          </h3>
          <EmailInput {...searchParams} />
        </div>
      </section>
    </>
  );
}

const nicePostsUris = [
  // https://bsky.app/profile/thisfeedis.gay/post/3k7wqoxqcxk2f
  "at://did:plc:hpu7oaq76zlbzi4scasp47bz/app.bsky.feed.post/3k7wqoxqcxk2f",
  // https://bsky.app/profile/osc.ac/post/3k7wpjkkxee27
  "at://did:plc:esmiuxk53vmsllayghrq676w/app.bsky.feed.post/3k7wpjkkxee27",
  // https://bsky.app/profile/maskedman.bsky.social/post/3k7hob6or5i2m
  "at://did:plc:kbxa3w7o6oj4rlbitcdd2rib/app.bsky.feed.post/3k7hob6or5i2m",
  // https://bsky.app/profile/seanm4c.bsky.social/post/3k7rv6jlrqk2s
  "at://did:plc:sgdtbaxx6xyzwbffvfqoyc4t/app.bsky.feed.post/3k7rv6jlrqk2s",
  // https://bsky.app/profile/ctartisan.bsky.social/post/3k7teitfu3g2b
  "at://did:plc:erbbtcw5pqhjgjrhxgaw6nma/app.bsky.feed.post/3k7teitfu3g2b",
  // https://bsky.app/profile/pavlovforgoths.com/post/3k7rqpuypef2z
  "at://did:plc:iniljto6o7z667rqvphp47km/app.bsky.feed.post/3k7rqpuypef2z",
  // https://bsky.app/profile/hazey.pet/post/3k7mryjxnfd2n
  "at://did:plc:x5uw2ciejsr2ajn4rw2xxtdb/app.bsky.feed.post/3k7mryjxnfd2n",
  // https://bsky.app/profile/steffenrusten.bsky.social/post/3k7lh6j45qn2s
  "at://did:plc:5dqtzkkxdyhfj7nhzp3iyxnu/app.bsky.feed.post/3k7lh6j45qn2s",
  // https://bsky.app/profile/mrchee.se/post/3k7tp5ezy252b
  "at://did:plc:35peeambfq2eu7u3wvkkatpk/app.bsky.feed.post/3k7tp5ezy252b",
  // https://bsky.app/profile/experimilk.bsky.social/post/3k7bp6ifoqh2e
  "at://did:plc:yucu4m7ovhqulwtvcjpfil6g/app.bsky.feed.post/3k7bp6ifoqh2e",
];

async function getNicePosts() {
  try {
    const res1 = await fetch(
      "https://bsky.social/xrpc/com.atproto.server.createSession",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: env.BSKY_EMAIL,
          password: env.BSKY_PASSWORD,
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
      nicePostsUris.map((post) => ["uris", post]),
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
  } catch (err) {
    console.error(err);
    return [];
  }
}