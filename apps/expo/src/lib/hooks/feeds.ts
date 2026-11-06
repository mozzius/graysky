import { useEffect, useMemo, useState } from "react";
import { type AtUriString } from "@atproto/lex";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
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
import { chunk } from "../utils/chunk";
import { produce } from "../utils/produce";
import { isType } from "../utils/types";
import {
  getPreferences,
  putPreferences,
  useContentFilter,
  useHaptics,
} from "./preferences";

export const useSavedFeeds = () => {
  const agent = useAgent();

  return useQuery({
    queryKey: ["feeds", "saved"],
    queryFn: async () => {
      const preferences = await getPreferences(agent);
      const feeds = preferences.find((pref) =>
        isType(app.bsky.actor.defs.savedFeedsPref, pref),
      ) as app.bsky.actor.defs.SavedFeedsPref | undefined;
      if (!feeds || feeds.saved.length === 0)
        return {
          feeds: [],
          lists: [],
          pinned: [],
          saved: [],
          preferences,
        };

      const allUris = [...new Set([...feeds.pinned, ...feeds.saved])];

      // fetch all feed generators. long-time accounts can have hundreds, which
      // makes the url too long (414), so fetch them in chunks
      const feedGeneratorsUris = allUris.filter((x) =>
        x.includes("app.bsky.feed.generator"),
      );
      const [generatorChunks, myLists] = await Promise.all([
        Promise.allSettled(
          chunk(feedGeneratorsUris).map((uris) =>
            agent.call(app.bsky.feed.getFeedGenerators, { feeds: uris }),
          ),
        ),
        agent
          .call(app.bsky.graph.getLists, { actor: agent.assertDid })
          .catch((err: unknown) => {
            // not fatal - the lists get fetched one by one below instead
            console.warn("failed to fetch own lists", err);
            return { lists: [] };
          }),
      ]);
      // show what we can if some chunks fail, but don't pretend there are no
      // feeds if they all failed
      const failedChunk = generatorChunks.find((x) => x.status === "rejected");
      if (
        failedChunk &&
        !generatorChunks.some((x) => x.status === "fulfilled")
      ) {
        throw failedChunk.reason as Error;
      }
      const generators = {
        feeds: generatorChunks.flatMap((x) =>
          x.status === "fulfilled" ? x.value.feeds : [],
        ),
      };

      // fetch all lists
      const listUris = allUris.filter(
        (
          x, // find all list uris
        ) =>
          x.includes("app.bsky.graph.list") &&
          // ...that we haven't already fetched
          !myLists.lists.find((list) => list.uri === x),
      );

      const otherLists = await Promise.allSettled(
        listUris.map(async (uri) => {
          const list = await agent.call(app.bsky.graph.getList, {
            list: uri,
            limit: 1,
          });
          return list.list;
        }),
      );

      const lists = [
        ...myLists.lists,
        ...otherLists.flatMap((x) => (x.status === "fulfilled" ? x.value : [])),
      ];

      return {
        feeds: generators.feeds.map((feed) => ({
          $type: "app.bsky.feed.defs#generatorView" as const,
          ...feed,
          pinned: feeds.pinned.includes(feed.uri),
        })),
        lists: lists.map((list) => ({
          $type: "app.bsky.graph.defs#listView" as const,
          ...list,
          pinned: feeds.pinned.includes(list.uri),
        })),
        pinned: feeds.pinned,
        saved: feeds.saved,
        preferences,
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
            // not a real generator view, but close enough for the bits we
            // display. the empty strings aren't valid dids/uris, hence the cast
          } as unknown as app.bsky.feed.defs.GeneratorView,
          isOnline: true,
          isValid: true,
        };
      }
      return await agent.call(app.bsky.feed.getFeedGenerator, {
        feed: feed as AtUriString,
      });
    },
  });
};

export const useToggleFeedPref = (
  preferences?: app.bsky.actor.defs.Preferences,
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

      const saveUri = save as AtUriString | undefined;
      const pinUri = pin as AtUriString | undefined;

      await putPreferences(
        agent,
        produce(preferences, (draft) => {
          let hasPref;
          for (const pref of draft) {
            if (isType(app.bsky.actor.defs.savedFeedsPref, pref)) {
              hasPref = true;
              if (saveUri) {
                if (pref.saved.includes(saveUri)) {
                  pref.pinned = pref.pinned.filter((f) => f !== saveUri);
                  pref.saved = pref.saved.filter((f) => f !== saveUri);
                } else {
                  pref.saved.push(saveUri);
                }
              } else if (pinUri) {
                if (pref.pinned.includes(pinUri)) {
                  pref.pinned = pref.pinned.filter((f) => f !== pinUri);
                } else {
                  pref.pinned.push(pinUri);
                }
              }
            }
          }
          if (!hasPref) {
            draft.push({
              $type: "app.bsky.actor.defs#savedFeedsPref",
              pinned: pinUri ? [pinUri] : [],
              saved: saveUri ? [saveUri] : [],
            });
          }
        }),
      );
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
  const [pinned, setPinned] = useState<AtUriString[]>(
    savedFeeds.data?.pinned ?? [],
  );
  const [saved, setSaved] = useState<AtUriString[]>(
    savedFeeds.data?.saved ?? [],
  );

  const stringifiedPinned = savedFeeds.data?.pinned
    ? savedFeeds.data.pinned.join()
    : null;
  const stringifiedSaved = savedFeeds.data?.saved
    ? savedFeeds.data.saved.join()
    : null;

  useEffect(() => {
    if (stringifiedPinned)
      setPinned(stringifiedPinned.split(",") as AtUriString[]);
  }, [stringifiedPinned]);

  useEffect(() => {
    if (stringifiedSaved)
      setSaved(stringifiedSaved.split(",") as AtUriString[]);
  }, [stringifiedSaved]);

  const reorderFavs = useMutation({
    mutationFn: async (pins: AtUriString[]) => {
      if (!savedFeeds.data) return;
      setPinned(pins);
      await putPreferences(
        agent,
        produce(savedFeeds.data.preferences, (draft) => {
          for (const pref of draft) {
            if (isType(app.bsky.actor.defs.savedFeedsPref, pref)) {
              pref.pinned = pins;
            }
          }
        }),
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["feeds", "saved"] }),
  });

  const reorderRest = useMutation({
    mutationFn: async (uris: AtUriString[]) => {
      if (!savedFeeds.data) return;
      const saved = [...pinned, ...uris];
      setSaved(saved);
      await putPreferences(
        agent,
        produce(savedFeeds.data.preferences, (draft) => {
          for (const pref of draft) {
            if (isType(app.bsky.actor.defs.savedFeedsPref, pref)) {
              pref.saved = saved;
            }
          }
        }),
      );
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
        const result = await agent.call(app.bsky.feed.getTimeline, {
          cursor: pageParam,
        });
        ({ cursor, feed: posts } = result);
      } else {
        const result = await agent.call(
          app.bsky.feed.getFeed,
          {
            feed: feed as AtUriString,
            cursor: pageParam,
          },
          { headers: { "Accept-Language": contentLanguages.join(",") } },
        );
        ({ cursor, feed: posts } = result);
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
          isType(app.bsky.embed.record.view, item.post.embed) ||
          isType(app.bsky.embed.recordWithMedia.view, item.post.embed);
        const isByUnfollowed =
          !item.post.author.viewer?.following &&
          item.post.author.did !== agent.did;

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
          if (isType(app.bsky.feed.defs.postView, item.reply.parent)) {
            const parent = item.reply.parent;
            if (
              !parent.author.viewer?.following &&
              parent.author.did !== agent.did
            ) {
              return [];
            }
          }
        }
      }

      // hide replies to blocked posts

      if (
        item.reply &&
        (isType(app.bsky.feed.defs.blockedPost, item.reply.parent) ||
          isType(app.bsky.feed.defs.blockedPost, item.reply.root))
      ) {
        return [];
      }

      // mini threads

      if (item.reply && !item.reason) {
        if (isType(app.bsky.feed.defs.postView, item.reply.parent)) {
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
    agent.did,
  ]);

  return { timeline, data, preferences, contentFilter };
};

export type TimelineItem = ReturnType<typeof useTimeline>["data"][number];
