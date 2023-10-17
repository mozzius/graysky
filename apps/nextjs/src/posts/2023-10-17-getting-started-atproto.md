---
title: "Getting started with #atdev"
date: 2023-10-17
author: "@mozzius.dev"
---

# So, you want to make a Bluesky client?

[Bluesky Social](https://blueskyweb.xyz) is an upstart social network in the style of Twitter. However, "Bluesky" and the Bluesky client is just a proof of concept for what the Bluesky Team is really building - the AT Protocol. The AT Protocol, or "ATProto" for short, is an attempt to create a decentralized social network protocol that solves some of the problems that competitors like [ActivityPub](https://www.w3.org/TR/activitypub/) have - namely, account portability and a "big world" architecture that allows global aggregation.

> AT Protocol is meant to stand for "Authenticated Transfer Protocol", but we all know that's just a backronym that [Paul](https://bsky.app/profile/pfrazee.com) came up with.

What makes this so interesting it that the APIs used to build Bluesky are completely open! Anyone can build a Bluesky client, and the official client uses exactly the same APIs that Graysky or any other client uses. Even better, there's an NPM package called `@atproto/api` that provides a simple typesafe interface to the ATProto APIs.

In this blog post, we're going to go through the process of building a super simple Bluesky client using the `@atproto/api` package. We'll be using [Next.js](https://nextjs.org) for this tutorial, but you can use any framework you like - the `@atproto/api` package is framework agnostic. This tutorial will assume you have some familiarity with JavaScript.

While you need an invite code to make a Bluesky account, you do *not* need an account to use a fair number of the ATProto APIs. Rather than connecting to a Personal Data Server, or PDS, you can connect directly to the "AppView", which does not need an account to view.

> For a better understanding of these terms, check out the [Federation Architecture Overview](https://blueskyweb.xyz/blog/5-5-2023-federation-architecture).

## Getting started

Let's make a new Next.js app:

```bash
pnpm create next-app --tailwind --eslint --src-dir --ts --app --import-alias="~/*" my-bsky-app
```

> I'm using [pnpm](https://pnpm.io) here, but you can use npm or yarn if you prefer.

Open up the project in your favorite editor, and let's get started!

## Setting up the API client

The first thing we need to do is install the `@atproto/api` package.

```bash
pnpm add @atproto/api
```


Before we do anything else, quickly remove all the garbage CSS that comes with the Next.js template by setting `src/app/globals.css` to the following:

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Next, let's make a new file called `src/lib/api.ts` and add the following code:

```ts
// src/lib/api.ts
import { BskyAgent } from "@atproto/api";

export const agent = new BskyAgent({
  // This is the AppView URL
  service: "https://api.bsky.app",
  // If you were making an authenticated client, you would
  // use the PDS URL here instead - the main one is bsky.social
  // service: "https://bsky.social",
});
```

This is our API client we can use to make requests to the AppView. Let's make the homepage (`src/app/page.tsx`) list the top 10 custom feeds.

```ts
// src/app/page.tsx
import { agent } from "~/lib/api";

export default async function Homepage() {
  const feeds = await agent.app.bsky.unspecced.getPopularFeedGenerators({
    limit: 10,
  });

  return (
    <div className="container mx-auto">
      <h1 className="font-bold text-xl my-4">Top Feeds</h1>
      <ul>
        {feeds.data.feeds.map((feed) => (
          <li key={feed.displayName}>{feed.displayName}</li>
        ))}
      </ul>
    </div>
  );
}
```

If you run `pnpm dev` and go to `http://localhost:3000`, you should see a list of the top 10 feeds on Bluesky!

If it worked, congrats! You've made your first Bluesky client! If not, make sure you followed all the steps correctly.

## Viewing a post

Let's make a new page that shows a post. For the time being, let's just hard-code the post URI. The post we will use is this one:

```ts
const EXAMPLE_POST = "at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.feed.post/3karfx5vrvv23"
```

> This is an AT URI, composed of a DID (which are how users are uniquely identified), the type of record (in this case, a post), and the `rkey` of the post. We could also use the user's handle to identify the post, but that risks breaking things if the user changes their handle. DIDs are permanent, so they're a better choice.

We'll use `app.bsky.feed.getPostThread` to get the post and its replies. Let's just display the post author's name.

```tsx
// src/app/page.tsx
import { agent } from "~/lib/api";

const EXAMPLE_POST =
  "at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.feed.post/3karfx5vrvv23";

export default function Homepage() {
    const thread = await agent.app.bsky.feed.getPostThread({
    uri: EXAMPLE_POST,
  })

  return (
    <div className="container mx-auto">
      <p>{thread.data.thread.post.author.displayName}</p>
    </div>
  );
}
```

Oh no! Type error! That's because the thread's main post might be deleted, or blocked. Let's fix this by checking what kind of view we're getting back, and error if it's been deleted or blocked. `@atproto/api` provides a handy set of type guards for this purpose.

```tsx
// src/app/page.tsx
import { AppBskyFeedDefs } from "@atproto/api";
import { agent } from "~/lib/api";

const EXAMPLE_POST =
  "at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.feed.post/3karfx5vrvv23";

export default async function Homepage() {
  const thread = await agent.app.bsky.feed.getPostThread({
    uri: EXAMPLE_POST,
  });

  if (!AppBskyFeedDefs.isThreadViewPost(thread.data.thread))
    throw new Error("Expected a thread view post");

  return (
    <div className="container mx-auto">
      <p>{thread.data.thread.post.author.displayName}</p>
    </div>
  );
}
```

Now we can see the post author's display name! Let's also display the post content. We'll need to use another type guard for the post content. While we're at it, let's also display author's handle, and avatar.

```tsx
// src/app/page.tsx
import { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { agent } from "~/lib/api";

const EXAMPLE_POST =
  "at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.feed.post/3karfx5vrvv23";

export default async function Homepage() {
  const thread = await agent.app.bsky.feed.getPostThread({
    uri: EXAMPLE_POST,
  });

  if (!AppBskyFeedDefs.isThreadViewPost(thread.data.thread))
    throw new Error("Expected a thread view post");

  const post = thread.data.thread.post;

  if (!AppBskyFeedPost.isRecord(post.record))
    throw new Error("Expected a post with a record");

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-row items-center">
          <img
            src={post.author.avatar}
            alt={post.author.handle}
            className="w-12 h-12 rounded-full"
          />
          <div className="ml-4">
            <p className="font-medium text-lg">{post.author.displayName}</p>
            <p>@{post.author.handle}</p>
          </div>
        </div>
        <div className="mt-4">
          <p>{post.record.text}</p>
        </div>
      </div>
    </div>
  );
}
```

You should now be able to see `@retr0.id`'s post!

## Viewing any post

Let's now set up routing, so that we can view any post via the URL. The URL will be in the format `/profile/:handle/post/:rkey`. We'll take the two dynamic sections to construct the AT URI, and then use that to fetch the post thread like we did befire. Since we're using the Next.js App Routing, we'll need to make a folder structure like this:

```
app
├── layout.tsx
├── page.tsx
└── profile
    └── [handle]
        └── post
            └── [rkey]
                └── page.tsx
```

Let's then get these dynamic sections and use it to construct the AT URI. Make sure to decode `params.handle` - a DID contains `:` characters, which get URL encoded automatically.

```tsx
// src/app/profile/[handle]/post/[rkey]/page.tsx

interface Props {
  params: {
    handle: string;
    rkey: string;
  };
}

export default function PostView({ params }: Props) {
  const uri = `at://${decodeURIComponent(params.handle)}/app.bsky.feed.post/${
    params.rkey
  }`;

  return <p>{uri}</p>;
}
```

Now, we can use this URI to get the post and display it. Copy paste the code from `src/app/page.tsx` into `src/app/profile/[handle]/post/[rkey]/page.tsx`, and replace `EXAMPLE_POST` with `uri`.


```tsx
// src/app/profile/[handle]/post/[rkey]/page.tsx
import { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { agent } from "~/lib/api";

interface Props {
  params: {
    handle: string;
    rkey: string;
  };
}

export default async function PostView({ params }: Props) {
  const uri = `at://${decodeURIComponent(params.handle)}/app.bsky.feed.post/${
    params.rkey
  }`;
  
  const thread = await agent.app.bsky.feed.getPostThread({ uri });

  if (!AppBskyFeedDefs.isThreadViewPost(thread.data.thread))
    throw new Error("Expected a thread view post");

  const post = thread.data.thread.post;

  if (!AppBskyFeedPost.isRecord(post.record))
    throw new Error("Expected a post with a record");

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="w-full max-w-sm">
        <div className="flex flex-row items-center">
          <img
            src={post.author.avatar}
            alt={post.author.handle}
            className="w-12 h-12 rounded-full"
          />
          <div className="ml-4">
            <p className="font-medium text-lg">{post.author.displayName}</p>
            <p>@{post.author.handle}</p>
          </div>
        </div>
        <div className="mt-4">
          <p>{post.record.text}</p>
        </div>
      </div>
    </div>
  );
}
```

Now, if you go to [http://localhost:3000/profile/did:plc:vwzwgnygau7ed7b7wt5ux7y2/post/3karfx5vrvv23](http://localhost:3000/profile/did:plc:vwzwgnygau7ed7b7wt5ux7y2/post/3karfx5vrvv23), you should see the same post as before!

Here are some other posts you can look at:

- http://localhost:3000/profile/did:plc:iwr4qf7c7ew7nm5l26ful6uo/post/3k7a3sxclmb2w
- http://localhost:3000/profile/did:plc:fpruhuo22xkm5o7ttr2ktxdo/post/3k27cy5if2m2o
- http://localhost:3000/profile/did:plc:oky5czdrnfjpqslsw2a5iclo/post/3jxvznajs7m2h

> If you want to be able to use a handle as well as a DID, as the official app does, check to see if `param.handle` starts with `did:`, and if not, use `agent.resolveHandle({ handle: param.handle })` to get the DID of the user.


## Next steps

Now that you've got a basic client up and running, you can start to build out more features. Here are some ideas:

### Make a `<Post />` component

There are loads of things in the post that we're not displaying, such as the number of likes, reposts, and replies, the timestamp, and any embeds the post might have. Take what we have already and make a reusable post component! It should take a `post` prop with the type `AppBskyFeedDefs.PostView`.

#### Embeds

There are 4 types of embeds - images, external link, record (a.k.a a quote post), or a record + the other two types. Use type guards to differentiate between them, and display them accordingly.

#### Rich text

Posts can have mentions, hyperlinks, and hashtags, using "facets" to indicate what part of the source text has extra information. Use the `RichText` helper to help display these. Here's a rough guide on how you'd use it:

```tsx
import { RichText } from "@atproto/api";

const rt = new RichText({
  text: post.record.text,
  facets: post.record.facets,
});

const text = [];

for (const segment of rt.segments()) {
  if (segment.isMention()) {
    text.push(
      <a className="text-blue-500" href={`/profile/${segment.mention?.did}`}>
        {segment.text}
      </a>
    );
  } else if (segment.isLink()) {
    text.push(
      <a className="text-blue-500" href={segment.link?.uri}>
        {segment.text}
      </a>
    );
  } else if (segment.isTag()) {
    text.push(<span className="text-blue-500">{segment.text}</span>);
  } else {
    text.push(segment.text);
  }
}
```

### Display replies

A little tricker, but `agent.getPostThread()` returns all the post's replies in a recursive data structure. You can use this to display the replies to a post. Same applies to a post's parents, if it itself is a reply. Link them all together to let you browse through a post!

### View a user's profile

You can view a user's profile using `agent.getProfile()`, and see a user's posts using `agent.getActorFeed()`.

### View a custom feed

Using the list of feeds we made in the beginning, you could could link to each respective feed and display the posts, using `agent.app.bsky.feed.getFeed({ feed: feed.uri })`. You can add infinite scrolling to this by using the `cursor`.

> Pro tip: `@tanstack/react-query` makes this 100x easier to manage!

### Logging in

Use `https://bsky.social` when making the session agent, and use `agent.login()` to log in. This unlocks the rest of the APIs - you can like posts and follow people, for example. Then then sky's the limit - you can do anything the official app can do, and more!

## Conclusion

I hope this tutorial has been helpful! If you have any questions, feel free to [ask on Bluesky](https://bsky.app/profile/mozzius). If you want to see the full code, you can find it [on GitHub](https://github.com/mozzius/bsky-simple-viewer). You can also see this app live [here](https://bsky-simple-viewer.vercel.app/).

If you want to see how a full-featured third-party client works, check out [Graysky on GitHub](https://github.com/mozzius/graysky)!

Happy hacking!

\- Samuel ([@mozzius.dev](https://bsky.app/profile/mozzius.dev))