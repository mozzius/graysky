import { useEffect, useMemo, useState } from "react";
import {
  AppBskyActorDefs,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  type AppBskyFeedGetFeedGenerator,
} from "@atproto/api";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getFeedViewPref } from "~/app/settings/feed";
import { useAgent } from "../agent";
import {
  useContentLanguages,
  useDefaultFeed,
  useHomepage,
} from "../storage/app-preferences";
import { produce } from "../utils/produce";
import { useContentFilter, useHaptics } from "./preferences";

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

      const myLists = await agent.app.bsky.graph.getLists({
        actor: agent.session!.did,
      });

      // fetch all lists
      const listUris = allUris.filter(
        (
          x, // find all list uris
        ) =>
          x.includes("app.bsky.graph.list") &&
          // ...that we haven't already fetched
          !myLists.data.lists.find((list) => list.uri === x),
      );

      const otherLists = await Promise.allSettled(
        listUris.map(async (uri) => {
          const list = await agent.app.bsky.graph.getList({
            list: uri,
            limit: 1,
          });
          if (!list.success) throw new Error("Could not fetch list");
          return list.data.list;
        }),
      );

      const lists = [
        ...myLists.data.lists,
        ...otherLists.flatMap((x) => (x.status === "fulfilled" ? x.value : [])),
      ];

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
  const { _ } = useLingui();

  return useQuery({
    queryKey: ["generator", feed],
    queryFn: async () => {
      if (feed === "following") {
        return {
          view: {
            did: "",
            displayName: _(
              msg({
                id: "following.feed",
                message: "Following",
                comment: "'Following' - The name of the main feed",
              }),
            ),
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
          let hasPref;
          for (const pref of draft) {
            if (
              AppBskyActorDefs.isSavedFeedsPref(pref) &&
              AppBskyActorDefs.validateSavedFeedsPref(pref).success
            ) {
              hasPref = true;
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
          if (!hasPref) {
            draft.push({
              $type: "app.bsky.actor.defs#savedFeedsPref",
              pinned: pin ? [pin] : [],
              saved: save ? [save] : [],
            });
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
  const defaultFeed = useDefaultFeed();
  const homepage = useHomepage();
  const contentLanguages = useContentLanguages();

  const timeline = useInfiniteQuery({
    queryKey: ["timeline", feed, contentLanguages],
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
        const timeline = await agent.app.bsky.feed.getFeed(
          {
            feed,
            cursor: pageParam,
          },
          { headers: { "Accept-Language": contentLanguages.join(",") } },
        );
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
    return flattened.flatMap((item) => {
      const filter = contentFilter(item.post.labels);

      if (filter?.visibility === "hide") return [];

      // preference filters

      if (homepage === "feeds" ? feed === "following" : feed === defaultFeed) {
        const isEmbed =
          AppBskyEmbedRecord.isView(item.post.embed) ||
          AppBskyEmbedRecordWithMedia.isView(item.post.embed);
        const isByUnfollowed =
          !item.post.author.viewer?.following &&
          item.post.author.did !== agent.session?.did;

        if (feedViewPref.hideReplies && item.reply) {
          return [];
        } else if (feedViewPref.hideReposts && item.reason) {
          return [];
        } else if (feedViewPref.hideQuotePosts && isEmbed) {
          return [];
        } else if (
          feedViewPref.hideRepliesByUnfollowed &&
          item.reply &&
          !item.reason
        ) {
          // reply by unfollowed
          if (isByUnfollowed) {
            return [];
          }
          // reply TO unfollowed
          if (AppBskyFeedDefs.isPostView(item.reply.parent)) {
            const parent = item.reply.parent;
            if (
              !parent.author.viewer?.following &&
              parent.author.did !== agent.session?.did
            ) {
              return [];
            }
          }
        }
      }

      // hide replies to blocked posts

      if (
        item.reply &&
        (AppBskyFeedDefs.isBlockedPost(item.reply.parent) ||
          AppBskyFeedDefs.isBlockedPost(item.reply.root))
      ) {
        return [];
      }

      // mini threads

      if (item.reply && !item.reason) {
        if (AppBskyFeedDefs.isPostView(item.reply.parent)) {
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
    });
  }, [
    timeline.data,
    preferences.data,
    contentFilter,
    homepage,
    feed,
    defaultFeed,
    agent.session?.did,
  ]);

  return { timeline, data, preferences, contentFilter };
};

export type TimelineItem = ReturnType<typeof useTimeline>["data"][number];
