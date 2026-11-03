import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDefaultHeaderHeight } from "expo-router/react-navigation";
import {
  type AtIdentifierString,
  type AtUriString,
  type Client,
  type HandleString,
} from "@atproto/lex";
import { app, com } from "@bsky/sdk/lexicons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { createClient, useAgent } from "~/lib/agent";
import { useContentFilter } from "~/lib/hooks/preferences";
import { useRefreshOnFocus } from "~/lib/utils/query";
import { isType } from "~/lib/utils/types";

export const useProfile = (handle?: string) => {
  const agent = useAgent();

  const actor = handle ?? agent.did;

  const query = useQuery({
    queryKey: ["profile", actor],
    queryFn: async (): Promise<app.bsky.actor.defs.ProfileViewDetailed> => {
      // Gets actor profile
      if (!actor) throw new Error("Not logged in");
      const did = actor.startsWith("did:")
        ? (actor as AtIdentifierString)
        : await agent
            .call(com.atproto.identity.resolveHandle, {
              handle: actor as HandleString,
            })
            .then((x) => x.did);
      const profile = await agent.call(app.bsky.actor.getProfile, {
        actor: did,
      });

      // // Get actor creation date based on his audit log creation date
      // const res = await fetch(`https://plc.directory/${did}/log/audit`);
      // if (res.ok) {
      //   const profileAuditLog = (await res.json()) as AuditLog;

      //   if (profileAuditLog[0]?.createdAt) {
      //     return {
      //       ...profile,
      //       createdAt: new Date(profileAuditLog[0].createdAt).toISOString(),
      //     };
      //   }
      // }
      return profile;
    },
  });

  useRefreshOnFocus(query.refetch);

  return query;
};

export const useProfileFeeds = (handle?: string) => {
  const agent = useAgent();

  const actor = handle ?? agent.did;

  return useInfiniteQuery({
    queryKey: ["profile", actor, "feeds"],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Not logged in");
      const feeds = await agent.call(app.bsky.feed.getActorFeeds, {
        actor: actor as AtIdentifierString,
        cursor: pageParam,
      });
      return feeds;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });
};

export const useProfilePosts = (
  mode: "posts" | "replies" | "likes" | "media",
  did?: string,
) => {
  const agent = useAgent();
  const { preferences, contentFilter } = useContentFilter();

  const actor = did ?? agent.did;

  const timeline = useInfiniteQuery({
    queryKey: ["profile", actor, "feed", mode],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Not logged in");
      let cursor;
      let posts = [];

      switch (mode) {
        case "posts": {
          const feed = await agent.call(app.bsky.feed.getAuthorFeed, {
            actor: actor as AtIdentifierString,
            cursor: pageParam,
            filter: "posts_no_replies",
          });
          ({ cursor, feed: posts } = feed);
          break;
        }
        case "replies": {
          const feed = await agent.call(app.bsky.feed.getAuthorFeed, {
            actor: actor as AtIdentifierString,
            cursor: pageParam,
            filter: "posts_with_replies",
          });
          ({ cursor, feed: posts } = feed);
          break;
        }
        case "media": {
          const feed = await agent.call(app.bsky.feed.getAuthorFeed, {
            actor: actor as AtIdentifierString,
            cursor: pageParam,
            filter: "posts_with_media",
          });
          ({ cursor, feed: posts } = feed);
          break;
        }
        case "likes": {
          const specificAgent = createClient(await getPds(actor, agent));
          const list = await specificAgent.list(app.bsky.feed.like, {
            repo: actor as AtIdentifierString,
            cursor: pageParam,
          });

          // split subjects into chunks of 25
          const subjectChunks = list.records
            .flatMap((record) =>
              // skip records that failed validation
              record.valid &&
              record.value.subject.uri.includes("app.bsky.feed.post")
                ? [record.value.subject.uri]
                : [],
            )
            .reduce<AtUriString[][]>(
              (acc, uri) => {
                if (acc[acc.length - 1]!.length === 25) {
                  acc.push([uri]);
                } else {
                  acc[acc.length - 1]!.push(uri);
                }
                return acc;
              },
              [[]],
            );

          const likes = await Promise.all(
            subjectChunks.map((chunk) =>
              agent.call(app.bsky.feed.getPosts, {
                uris: chunk,
              }),
            ),
          ).then((x) =>
            x
              .flatMap((x) => x.posts)
              .map((post) => ({ post, reply: undefined, reason: undefined })),
          );

          posts = likes;
          cursor = list.cursor;
          break;
        }
      }

      return { posts, cursor };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const timelineData = useMemo(() => {
    if (!timeline.data) return [];
    const flat = timeline.data.pages.flatMap((page) => page.posts);
    return flat.flatMap((item) => {
      const filter = contentFilter(item.post.labels);
      if (filter?.visibility === "hide") return [];
      switch (mode) {
        case "posts":
        case "likes":
        case "media":
          return [{ item, hasReply: false, filter }];
        case "replies":
          if (item.reply && !item.reason) {
            if (!isType(app.bsky.feed.defs.postView, item.reply.parent))
              return [];

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
      }
    });
  }, [timeline, mode, contentFilter]);

  return { preferences, timeline, timelineData };
};

export const useDefaultHeaderHeight = () => {
  const layout = useWindowDimensions();
  const { top } = useSafeAreaInsets();

  return getDefaultHeaderHeight(layout, false, top > 50 ? top - 5 : top);
};

export const useProfileLists = (did?: string) => {
  const agent = useAgent();

  const actor = did ?? agent.did;

  const query = useInfiniteQuery({
    queryKey: ["profile", actor, "lists"],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Not logged in");
      const lists = await agent.call(app.bsky.graph.getLists, {
        actor: actor as AtIdentifierString,
        cursor: pageParam,
      });
      return lists;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  return query;
};

const getPds = async (handle: string, agent: Client) => {
  let did = handle;
  if (!did.startsWith("did:")) {
    const resolution = await agent.call(com.atproto.identity.resolveHandle, {
      handle: handle as HandleString,
    });
    did = resolution.did;
  }
  const res = await fetch(`https://plc.directory/${did}`);
  if (!res.ok) throw new Error("PDS not found");
  const pds = (await res.json()) as {
    service: {
      id: string;
      type: string;
      serviceEndpoint: string;
    }[];
  };
  const service = pds.service.find((x) => x.id === "#atproto_pds");
  if (!service) throw new Error("PDS not found");
  return service.serviceEndpoint;
};
