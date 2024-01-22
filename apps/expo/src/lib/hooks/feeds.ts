import { useEffect, useMemo, useState } from "react";
import {
  AppBskyActorDefs,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  type AppBskyFeedGetFeedGenerator,
} from "@atproto/api";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getFeedViewPref } from "~/app/settings/feed";
import { useAgent } from "../agent";
import { produce } from "../utils/produce";
import { useAppPreferences, useContentFilter, useHaptics } from "./preferences";

export const useSavedFeeds = () => {
  const agent = useAgent();

  return useQuery({
    queryKey: ["feeds", "saved"],
    queryFn: async () => {
      const prefs = await agent.app.bsky.actor.getPreferences();
      if (!prefs.success) throw new Error("Could not fetch feeds");
      const feeds = prefs.data.preferences.find(
        (pref) =>
          AppBskyActorDefs.isSavedFeedsPref(pref) &&
          AppBskyActorDefs.validateSavedFeedsPref(pref).success,
      ) as AppBskyActorDefs.SavedFeedsPref | undefined;
      if (!feeds || feeds.saved.length === 0)
        return {
          feeds: [],
          lists: [],
          pinned: [],
          saved: [],
          preferences: prefs.data.preferences,
        };

      const allUris = [...new Set([...feeds.pinned, ...feeds.saved])];

      // fetch all feed generators
      const feedGeneratorsUris = allUris.filter((x) =>
        x.includes("app.bsky.feed.generator"),
      );
      const generators =
        feedGeneratorsUris.length === 0
          ? { success: true, data: { feeds: [] } }
          : await agent.app.bsky.feed.getFeedGenerators({
              feeds: feedGeneratorsUris,
            });

      if (!generators.success) {
        throw new Error("Could not fetch saved feeds");
      }

      // fetch all lists
      const listUris = allUris.filter((x) => x.includes("app.bsky.graph.list"));
      const lists =
        listUris.length === 0
          ? []
          : await Promise.all(
              listUris.map(async (uri) => {
                const list = await agent.app.bsky.graph.getList({ list: uri });
                if (!list.success) throw new Error("Could not fetch list");
                return list.data.list;
              }),
            )
              .catch(() => [])
              .then((lists) => lists.filter((x) => x !== undefined));

      return {
        feeds: generators.data.feeds.map((feed) => ({
          $type: "app.bsky.feed.defs#generatorView",
          ...feed,
          pinned: feeds.pinned.includes(feed.uri),
        })),
        lists: lists.map((list) => ({
          $type: "app.bsky.graph.defs#listView",
          ...list,
          pinned: feeds.pinned.includes(list.uri),
        })),
        pinned: feeds.pinned,
        saved: feeds.saved,
        preferences: prefs.data.preferences,
      };
    },
  });
};

export const useFeedInfo = (feed: string) => {
  const agent = useAgent();

  return useQuery({
    queryKey: ["generator", feed],
    queryFn: async () => {
      if (feed === "following") {
        return {
          view: {
            did: "",
            displayName: "Following",
            uri: "",
            cid: "",
            creator: {
              did: "",
              handle: "",
            },
            indexedAt: "",
          },
          isOnline: true,
          isValid: true,
        } satisfies AppBskyFeedGetFeedGenerator.OutputSchema;
      }
      const gen = await agent.app.bsky.feed.getFeedGenerator({
        feed,
      });
      if (!gen.success) throw new Error("Failed to get generator");
      return gen.data;
    },
  });
};

export const useToggleFeedPref = (
  preferences?: AppBskyActorDefs.Preferences,
) => {
  const agent = useAgent();
  const queryClient = useQueryClient();
  const haptics = useHaptics();

  return useMutation({
    onMutate: () => haptics.impact(),
    mutationFn: async ({ save, pin }: { save?: string; pin?: string }) => {
      if (!preferences) return;
      if (!save && !pin) throw new Error("Must provide save or pin");
      if (save && pin) throw new Error("Cannot provide both save and pin");

      await agent.app.bsky.actor.putPreferences({
        preferences: produce(preferences, (draft) => {
          for (const pref of draft) {
            if (
              AppBskyActorDefs.isSavedFeedsPref(pref) &&
              AppBskyActorDefs.validateSavedFeedsPref(pref).success
            ) {
              if (save) {
                if (pref.saved.includes(save)) {
                  pref.pinned = pref.pinned.filter((f) => f !== save);
                  pref.saved = pref.saved.filter((f) => f !== save);
                } else {
                  pref.saved.push(save);
                }
              } else if (pin) {
                if (pref.pinned.includes(pin)) {
                  pref.pinned = pref.pinned.filter((f) => f !== pin);
                } else {
                  pref.pinned.push(pin);
                }
              }
            }
          }
        }),
      });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["feeds", "saved"] }),
  });
};

export const useReorderFeeds = (
  savedFeeds: ReturnType<typeof useSavedFeeds>,
) => {
  const agent = useAgent();
  const queryClient = useQueryClient();
  const [pinned, setPinned] = useState(savedFeeds.data?.pinned ?? []);
  const [saved, setSaved] = useState(savedFeeds.data?.saved ?? []);

  const stringifiedPinned = savedFeeds.data?.pinned
    ? savedFeeds.data.pinned.join()
    : null;
  const stringifiedSaved = savedFeeds.data?.saved
    ? savedFeeds.data.saved.join()
    : null;

  useEffect(() => {
    if (stringifiedPinned) setPinned(stringifiedPinned.split(","));
  }, [stringifiedPinned]);

  useEffect(() => {
    if (stringifiedSaved) setSaved(stringifiedSaved.split(","));
  }, [stringifiedSaved]);

  const reorderFavs = useMutation({
    mutationFn: async (pins: string[]) => {
      if (!savedFeeds.data) return;
      setPinned(pins);
      await agent.app.bsky.actor.putPreferences({
        preferences: produce(savedFeeds.data.preferences, (draft) => {
          for (const pref of draft) {
            if (AppBskyActorDefs.isSavedFeedsPref(pref)) {
              pref.pinned = pins;
            }
          }
        }),
      });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["feeds", "saved"] }),
  });

  const reorderRest = useMutation({
    mutationFn: async (uris: string[]) => {
      if (!savedFeeds.data) return;
      const saved = [...pinned, ...uris];
      setSaved(saved);
      await agent.app.bsky.actor.putPreferences({
        preferences: produce(savedFeeds.data.preferences, (draft) => {
          for (const pref of draft) {
            if (AppBskyActorDefs.isSavedFeedsPref(pref)) {
              pref.saved = saved;
            }
          }
        }),
      });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["feeds", "saved"] }),
  });

  return { pinned, saved, reorderFavs, reorderRest };
};

export const useTimeline = (feed: string) => {
  const agent = useAgent();
  const { contentFilter, preferences } = useContentFilter();
  const [{ homepage, defaultFeed }] = useAppPreferences();

  const timeline = useInfiniteQuery({
    queryKey: ["timeline", feed],
    queryFn: async ({ pageParam }) => {
      let cursor;
      let posts = [];
      if (feed === "following") {
        const timeline = await agent.getTimeline({
          cursor: pageParam,
        });
        if (!timeline.success) throw new Error("Failed to fetch feed");
        ({ cursor, feed: posts } = timeline.data);
      } else {
        const timeline = await agent.app.bsky.feed.getFeed({
          feed,
          cursor: pageParam,
        });
        if (!timeline.success) throw new Error("Failed to fetch feed");
        ({ cursor, feed: posts } = timeline.data);
      }
      return { posts, cursor };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const data = useMemo(() => {
    if (!timeline.data) return [];
    const feedViewPref = getFeedViewPref(preferences.data);
    const flattened = timeline.data.pages.flatMap((page) => page.posts);
    return flattened
      .map((item) => {
        const filter = contentFilter(item.post.labels);

        if (filter?.visibility === "hide") return [];

        // preference filters

        if (
          homepage === "feeds" ? feed === "following" : feed === defaultFeed
        ) {
          const isEmbed =
            AppBskyEmbedRecord.isView(item.post.embed) ||
            AppBskyEmbedRecordWithMedia.isView(item.post.embed);
          const isByUnfollowed = !item.post.author.viewer?.following;

          if (feedViewPref.hideReplies && item.reply) {
            return [];
          } else if (feedViewPref.hideReposts && item.reason) {
            return [];
          } else if (feedViewPref.hideQuotePosts && isEmbed) {
            return [];
          } else if (
            feedViewPref.hideRepliesByUnfollowed &&
            item.reply &&
            isByUnfollowed
          ) {
            return [];
          }
        }

        if (item.reply && !item.reason) {
          if (
            AppBskyFeedDefs.isBlockedPost(item.reply.parent) ||
            AppBskyFeedDefs.isBlockedPost(item.reply.root)
          ) {
            return [];
          } else if (AppBskyFeedDefs.isPostView(item.reply.parent)) {
            if (item.reply.parent.author.viewer?.muted) return [];
            const parentFilter = contentFilter(item.reply.parent.labels);
            if (parentFilter?.visibility === "hide") return [];
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
        } else {
          return [{ item, hasReply: false, filter }];
        }
      })
      .flat();
  }, [timeline, contentFilter, preferences.data, defaultFeed, homepage, feed]);

  return { timeline, data, preferences, contentFilter };
};

export type TimelineItem = ReturnType<typeof useTimeline>["data"][number];
