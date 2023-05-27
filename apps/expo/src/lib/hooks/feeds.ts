import { useMemo } from "react";
import { AppBskyActorDefs, AppBskyFeedDefs } from "@atproto/api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../agent";

export const useSavedFeeds = (
  { pinned }: { pinned: boolean } = { pinned: false },
) => {
  const agent = useAuthedAgent();

  return useQuery({
    queryKey: ["feeds", "saved", { pinned }],
    queryFn: async () => {
      const prefs = await agent.app.bsky.actor.getPreferences();
      if (!prefs.success) throw new Error("Could not fetch feeds");
      const feeds = prefs.data.preferences.find(
        (pref) =>
          AppBskyActorDefs.isSavedFeedsPref(pref) &&
          AppBskyActorDefs.validateSavedFeedsPref(pref).success,
      ) as AppBskyActorDefs.SavedFeedsPref | undefined;
      if (!feeds)
        return {
          feeds: [],
          pinned: [],
          saved: [],
          preferences: prefs.data.preferences,
        };
      const generators = await agent.app.bsky.feed.getFeedGenerators({
        feeds: pinned ? feeds.pinned : feeds.saved,
      });
      if (!generators.success) {
        throw new Error("Could not fetch feed generators");
      }
      return {
        feeds: feeds.saved.map((uri) => ({
          ...generators.data.feeds.find((gen) => gen.uri === uri)!,
          pinned: feeds.pinned.includes(uri),
        })),
        pinned: feeds.pinned,
        saved: feeds.saved,
        preferences: prefs.data.preferences,
      };
    },
  });
};

export const useTimeline = (algorithm: string) => {
  const agent = useAuthedAgent();

  const timeline = useInfiniteQuery({
    queryKey: ["timeline", algorithm],
    queryFn: async ({ pageParam }) => {
      if (algorithm === "following") {
        const following = await agent.getTimeline({
          cursor: pageParam as string | undefined,
        });
        if (!following.success) throw new Error("Failed to fetch feed");
        return following.data;
      } else {
        // const generator = await agent.app.bsky.feed.getFeedGenerator({
        //   feed: algorithm,
        // });
        // if (!generator.success)
        //   throw new Error("Failed to fetch feed generator");
        // console.log(generator.data);
        // if (!generator.data.isOnline || !generator.data.isValid) {
        //   throw new Error(
        //     "This custom feed is not online or may be experiencing issues",
        //   );
        // }
        const feed = await agent.app.bsky.feed.getFeed({
          feed: algorithm,
          cursor: pageParam as string | undefined,
        });
        if (!feed.success) throw new Error("Failed to fetch feed");
        return feed.data;
      }
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const data = useMemo(() => {
    if (!timeline.data) return [];
    const flattened = timeline.data.pages.flatMap((page) => page.feed);
    return flattened
      .map((item) =>
        // if the preview item is replying to this one, skip
        // arr[i - 1]?.reply?.parent?.cid === item.cid
        //   ? [] :
        {
          if (item.reply && !item.reason) {
            if (AppBskyFeedDefs.isBlockedPost(item.reply.parent)) {
              return [];
            } else if (
              AppBskyFeedDefs.isPostView(item.reply.parent) &&
              AppBskyFeedDefs.validatePostView(item.reply.parent).success
            ) {
              return [
                { item: { post: item.reply.parent }, hasReply: true },
                { item, hasReply: false },
              ];
            } else {
              return [{ item, hasReply: false }];
            }
          } else {
            return [{ item, hasReply: false }];
          }
        },
      )
      .flat();
  }, [timeline]);

  return { timeline, data };
};
