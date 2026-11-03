import { l } from "@atproto/lex";
import { app } from "@bsky/sdk/lexicons";

// @bsky/sdk deliberately leaves out app.bsky.unspecced.*
// from its lexicons, so these are the few methods from them that we use,
// written by hand. use them like any other schema:
// `agent.call(getPopularFeedGenerators, { query })`

/** an unspecced view of globally popular feed generators */
export const getPopularFeedGenerators = l.query(
  "app.bsky.unspecced.getPopularFeedGenerators",
  l.params({
    limit: l.optional(
      l.withDefault(l.integer({ minimum: 1, maximum: 100 }), 50),
    ),
    cursor: l.optional(l.string()),
    query: l.optional(l.string()),
  }),
  l.jsonPayload({
    cursor: l.optional(l.string()),
    feeds: l.array(l.ref(() => app.bsky.feed.defs.generatorView)),
  }),
);

const trendingTopic = l.object({
  topic: l.string(),
  displayName: l.optional(l.string()),
  description: l.optional(l.string()),
  link: l.string(),
});

export type TrendingTopic = l.Infer<typeof trendingTopic>;

/** get a list of trending topics */
export const getTrendingTopics = l.query(
  "app.bsky.unspecced.getTrendingTopics",
  l.params({
    viewer: l.optional(l.string({ format: "did" })),
    limit: l.optional(
      l.withDefault(l.integer({ minimum: 1, maximum: 25 }), 10),
    ),
  }),
  l.jsonPayload({
    topics: l.array(trendingTopic),
    suggested: l.array(trendingTopic),
  }),
);
