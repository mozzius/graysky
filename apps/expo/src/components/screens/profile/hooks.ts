import { useMemo } from "react";
import { AppBskyFeedDefs } from "@atproto/api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../../../lib/agent";
import { useContentFilter } from "../../../lib/hooks/preferences";
import { api } from "../../../lib/utils/api";
import { addDetectedLanguages } from "../../../lib/utils/detect-languages";

export const useProfile = (handle?: string) => {
  const agent = useAuthedAgent();

  const actor = handle ?? agent.session.did;

  return useQuery({
    queryKey: ["profile", actor],
    queryFn: async () => {
      const profile = await agent.getProfile({ actor });
      if (!profile.success) throw new Error("Profile not found");
      return profile.data;
    },
  });
};

export const useProfileFeeds = (handle?: string) => {
  const agent = useAuthedAgent();

  const actor = handle ?? agent.session.did;

  return useInfiniteQuery({
    queryKey: ["profile", actor, "feeds"],
    queryFn: async ({ pageParam }) => {
      const feeds = await agent.app.bsky.feed.getActorFeeds({
        actor,
        cursor: pageParam as string | undefined,
      });
      if (!feeds.success) throw new Error("Feeds not found");
      return feeds.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });
};

export const useProfilePosts = (
  mode: "posts" | "replies" | "likes" | "media",
  handle?: string,
) => {
  const agent = useAuthedAgent();
  const { contentFilter } = useContentFilter();
  const detect = api.translate.detect.useMutation();

  const actor = handle ?? agent.session.did;

  const timeline = useInfiniteQuery({
    queryKey: ["profile", actor, "feed", mode],
    queryFn: async ({ pageParam }) => {
      let cursor;
      let posts = [];

      switch (mode) {
        case "posts":
        case "replies":
        case "media":
          const feed = await agent.getAuthorFeed({
            actor,
            cursor: pageParam as string | undefined,
          });
          ({ cursor, feed: posts } = feed.data);
          break;
        case "likes":
          // all credit to @handlerug.me for this one
          // https://github.com/handlerug/bluesky-liked-posts
          const list = await agent.app.bsky.feed.like.list({
            repo: actor,
            cursor: pageParam as string | undefined,
          });

          // split subjects into chunks of 25
          const subjectChunks = list.records
            .filter((record) =>
              record.value.subject.uri.includes("app.bsky.feed.post"),
            )
            .reduce<string[][]>(
              (acc, record) => {
                if (acc[acc.length - 1]!.length === 25) {
                  acc.push([record.value.subject.uri]);
                } else {
                  acc[acc.length - 1]!.push(record.value.subject.uri);
                }
                return acc;
              },
              [[]],
            );

          const likes = await Promise.all(
            subjectChunks.map((chunk) =>
              agent.getPosts({
                uris: chunk,
              }),
            ),
          ).then((x) =>
            x
              .flatMap((x) => x.data.posts)
              .map((post) => ({ post, reply: undefined, reason: undefined })),
          );

          posts = likes;
          cursor = list.cursor;
          break;
      }

      return addDetectedLanguages(posts, cursor, detect);
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const timelineData = useMemo(() => {
    if (!timeline.data) return [];
    const flat = timeline.data.pages.flatMap((page) => page.feed);
    return flat
      .map((item) => {
        const filter = contentFilter(item.post.labels);
        if (filter?.visibility === "hide") return [];
        switch (mode) {
          case "posts":
            return item.reply && !item.reason
              ? []
              : [{ item, hasReply: false, filter }];
          case "replies":
            if (
              item.reply &&
              !item.reason &&
              AppBskyFeedDefs.isPostView(item.reply.parent)
            ) {
              const parentFilter = contentFilter(item.reply.parent.labels);
              if (parentFilter?.visibility === "hide")
                return [{ item, hasReply: false, filter }];
              return [
                {
                  item: { post: item.reply.parent },
                  hasReply: true,
                  filter: parentFilter,
                },
                { item, hasReply: false, filter },
              ];
            } else {
              return [{ item, hasReply: false, filter }];
            }
          case "likes":
            return [{ item, hasReply: false, filter }];
          case "media":
            return !item.post.embed?.images
              ? []
              : [{ item, hasReply: false, filter }];
        }
      })
      .flat();
  }, [timeline, mode, contentFilter]);

  return { timeline, timelineData };
};
