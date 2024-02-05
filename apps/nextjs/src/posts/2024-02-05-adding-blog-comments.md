---
title: "Adding comments to this blog"
date: 2024-02-05
author: "@mozzius.dev"
# atUri: "at://did:plc:sq6aa2wa32tiiqrbub64vcja/app.bsky.feed.post/3kbkmgfbuxi2c"
---

# This blog now has comments!

That might not sound particularly impressive, since I think most people would consider "comments on blogs" to be a Solved Problem. But I decided to go about it in a bit of a different way - **all the comments are fetched directly from Bluesky**. And I think the ease with which I did that goes a long way to demonstrating the power of Bluesky's Open Network, and is possibly worth talking about a little bit.

## Bluesky is completely open

When I say "Bluesky is completely open", I really mean it. You don't even need an API key to query the [AppView](https://www.docs.bsky.app/docs/advanced-guides/federation-architecture). Combined with the excellent tooling that Bluesky provides meant that implementating this feature took about hour, from scratch. Granted, I've been working with the API for a while now, but I think that's still pretty impressive.

Here's the code I used to fetch the comments (slightly simplified for clarity):

```tsx
export const CommentSection = async ({ uri }: { uri: string }) => {
  if (!uri) return <p className="text-center">No comments</p>;

  const agent = new BskyAgent({ service: "https://api.bsky.app" });
  const response = agent.getPostThread({ uri });

  const thread = response.data.thread;

  if (!AppBskyFeedDefs.isThreadViewPost(data.thread)) {
    return <p className="text-center">Could not find thread</p>;
  }

  if (!thread.replies || thread.replies.length === 0) {
    return <p className="text-center">No comments yet</p>;
  }

  return (
    <div className="space-y-8">
      {thread.replies.map((reply) => {
        // if the reply is blocked/deleted, skip it
        if (!AppBskyFeedDefs.isThreadViewPost(reply)) return null;
        return <Comment key={reply.post.uri} comment={reply} />;
      })}
    </div>
  );
};
```

> In the actual implementation, I don't use `BskyAgent` in favour of using `fetch` directly, due to Next.js overriding the `fetch` function, but this version is a bit more readable and typesafe. And it's basically the same under the hood.

Simply make a `<Comment />` component that renders a Bluesky post, and you're done! It's really that simple.

See [my other blog post for a step-by-step guide on how to render a Bluesky post](/blog/2023-10-17-getting-started-atproto). My blog comments take it one step futher by rendering the replies recursively, to make a threaded comment section.

## What this means

> "The organization is a future adversary"<br/>
> \- [Paul Frazee](https://news.ycombinator.com/item?id=35012757)

Bluesky talks a lot about being "Billionaire-proof", and I think the open API is a critical part of that. Due to it's decentralised nature, it's not just open, it's "locked open" - Bluesky (the company) couldn't start locking off access even if they wanted to. This is in harsh contrast to X (formerly Twitter) [turning off the free API, and making the paid API much more expensive](https://www.engadget.com/twitter-shut-off-its-free-api-and-its-breaking-a-lot-of-apps-222011637.html), and Reddit [suddenly charging 3rd party apps like Apollo $20 million a year for it's previously free API](https://www.theverge.com/2023/6/8/23754183/apollo-reddit-app-shutting-down-api) (instantly killing the 3rd party ecosystem).

This is critical to building trust in the platform among the developer community that Bluesky is trying to foster, and I think it's a big part of why Bluesky has [seen an explosion of community projects](https://atproto.com/community/projects). It's also a big part of why I'm so excited to be building on it. I don't have to worry that Bluesky will get bought out and "pull a Reddit" on me, because they literally can't. This matters, whether you want to add a little comment section to your blog, all the way up to building a full-fledged client.

I think this is also great for non-developers too. I completely stopped using Reddit when they killed Apollo, because the official app is garbage. *That's not something you have to worry about with Bluesky*, and it goes so much deeper than just the app. Every part of the platform can be swapped out, and that's a really powerful thing. We've watched platform after platform succumb to [enshittification](https://www.wired.com/story/plaintext-twitter-alternatives-enshittification-trap/), and even if Bluesky (the company) follows suit, Bluesky (the community) doesn't have to.

Overall, I'm really optimistic about the future of Bluesky, and I'm excited to see what else is possible.

Let me know what you think in the all-new comments!

\- Samuel ([@mozzius.dev](https://bsky.app/profile/mozzius.dev))
