import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppBskyFeedDefs,
  BskyAgent,
  type AppBskyActorDefs,
} from "@atproto/api";
import { getDefaultHeaderHeight } from "@react-navigation/elements";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAgent } from "~/lib/agent";
import { useContentFilter } from "~/lib/hooks/preferences";
import { useRefreshOnFocus } from "~/lib/utils/query";

type AuditLog = {
  cid: string;
  createdAt: string;
}[];

export const useProfile = (handle?: string) => {
  const agent = useAgent();

  const actor = handle ?? agent.session?.did;

  const query = useQuery({
    queryKey: ["profile", actor],
    queryFn: async (): Promise<AppBskyActorDefs.ProfileViewDetailed> => {
      // Gets actor profile
      if (!actor) throw new Error("Not logged in");
      const did = actor.startsWith("did:")
        ? actor
        : await agent.resolveHandle({ handle: actor }).then((x) => x.data.did);
      const profile = await agent.getProfile({ actor: did });
      if (!profile.success) throw new Error("Profile not found");

      // // Get actor creation date based on his audit log creation date
      // const res = await fetch(`https://plc.directory/${did}/log/audit`);
      // if (res.ok) {
      //   const profileAuditLog = (await res.json()) as AuditLog;

      //   if (profileAuditLog[0]?.createdAt) {
      //     return {
      //       ...profile.data,
      //       createdAt: new Date(profileAuditLog[0].createdAt).toISOString(),
      //     };
      //   }
      // }
      return profile.data;
    },
  });

  useRefreshOnFocus(query.refetch);

  return query;
};

export const useProfileFeeds = (handle?: string) => {
  const agent = useAgent();

  const actor = handle ?? agent.session?.did;

  return useInfiniteQuery({
    queryKey: ["profile", actor, "feeds"],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Not logged in");
      const feeds = await agent.app.bsky.feed.getActorFeeds({
        actor,
        cursor: pageParam,
      });
      if (!feeds.success) throw new Error("Feeds not found");
      return feeds.data;
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

  const actor = did ?? agent.session?.did;

  const timeline = useInfiniteQuery({
    queryKey: ["profile", actor, "feed", mode],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Not logged in");
      let cursor;
      let posts = [];

      switch (mode) {
        case "posts": {
          const feed = await agent.getAuthorFeed({
            actor,
            cursor: pageParam,
            filter: "posts_no_replies",
          });
          ({ cursor, feed: posts } = feed.data);
          break;
        }
        case "replies": {
          const feed = await agent.getAuthorFeed({
            actor,
            cursor: pageParam,
            filter: "posts_with_replies",
          });
          ({ cursor, feed: posts } = feed.data);
          break;
        }
        case "media": {
          const feed = await agent.getAuthorFeed({
            actor,
            cursor: pageParam,
            filter: "posts_with_media",
          });
          ({ cursor, feed: posts } = feed.data);
          break;
        }
        case "likes": {
          const specificAgent = new BskyAgent({
            service: await getPds(actor, agent),
          });
          const list = await specificAgent.app.bsky.feed.like.list({
            repo: actor,
            cursor: pageParam,
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
            if (!AppBskyFeedDefs.isPostView(item.reply.parent)) return [];

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

  const actor = did ?? agent.session?.did;

  const query = useInfiniteQuery({
    queryKey: ["profile", actor, "lists"],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Not logged in");
      const lists = await agent.app.bsky.graph.getLists({
        actor,
        cursor: pageParam,
      });
      if (!lists.success) throw new Error("Profile lists not found");
      return lists.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  return query;
};

const getPds = async (handle: string, agent: BskyAgent) => {
  let did = handle;
  if (!did.startsWith("did:")) {
    const resolution = await agent.resolveHandle({ handle });
    if (!resolution.success) throw new Error("Handle not found");
    did = resolution.data.did;
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
