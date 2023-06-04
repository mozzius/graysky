import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { AppBskyFeedDefs } from "@atproto/api";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ChevronRight, XOctagon } from "lucide-react-native";

import { useAuthedAgent } from "../../lib/agent";
import { useTabPressScroll } from "../../lib/hooks";
import { useContentFilter } from "../../lib/hooks/preferences";
import { assert } from "../../lib/utils/assert";
import { useUserRefresh } from "../../lib/utils/query";
import { Button } from "../button";
import { FeedPost } from "../feed-post";
import { ProfileInfo } from "../profile-info";
import { QueryWithoutData } from "../query-without-data";
import { Tab, Tabs } from "../tabs";

interface Props {
  handle: string;
  header?: boolean;
}

type Tab = "posts" | "replies" | "likes" | "feeds";

export const ProfileScreen = ({ handle, header = true }: Props) => {
  const { tab } = useLocalSearchParams() as { tab?: string };
  const [mode, setMode] = useState<Tab>(
    ["posts", "replies", "likes", "feeds"].includes(tab ?? "")
      ? (tab as Tab)
      : "posts",
  );
  const [atTop, setAtTop] = useState(true);
  const agent = useAuthedAgent();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<FlashList<any>>(null);
  const headerHeight = useHeaderHeight();
  const { top } = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { preferences, contentFilter } = useContentFilter();

  const tabOffset = headerHeight - top;

  const profile = useQuery({
    queryKey: ["profile", handle],
    queryFn: async () => {
      const profile = await agent.getProfile({
        actor: handle,
      });
      if (!profile.success) throw new Error("Profile not found");
      return profile.data;
    },
  });

  const feeds = useInfiniteQuery({
    queryKey: ["profile", handle, "feeds"],
    queryFn: async ({ pageParam }) => {
      const feeds = await agent.app.bsky.feed.getActorFeeds({
        actor: handle,
        cursor: pageParam as string | undefined,
      });
      if (!feeds.success) throw new Error("Feeds not found");
      return feeds.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const timeline = useInfiniteQuery({
    queryKey: ["profile", handle, "feed", mode],
    queryFn: async ({ pageParam }) => {
      switch (mode) {
        case "posts":
        case "replies":
          const feed = await agent.getAuthorFeed({
            actor: handle,
            cursor: pageParam as string | undefined,
          });
          return feed.data;

        case "likes":
          // all credit to @handlerug.me for this one
          // https://github.com/handlerug/bluesky-liked-posts
          const list = await agent.app.bsky.feed.like.list({
            repo: handle,

            cursor: pageParam as string | undefined,
          });

          const likes = await Promise.all(
            list.records
              .filter((record) =>
                record.value.subject.uri.includes("app.bsky.feed.post"),
              )
              .map(async (record) => {
                const post = await agent.getPostThread({
                  uri: record.value.subject.uri,
                  depth: 0,
                });

                if (!post.success) {
                  console.warn(
                    "Failed to fetch post",
                    record.value.subject.uri,
                  );
                  return null;
                }

                if (!AppBskyFeedDefs.isThreadViewPost(post.data.thread)) {
                  assert(
                    AppBskyFeedDefs.validateThreadViewPost(post.data.thread),
                  );
                  return null;
                }

                // convert thread view post to feed view post
                return {
                  post: post.data.thread.post,
                  ...(AppBskyFeedDefs.isThreadViewPost(
                    post.data.thread.parent,
                  ) &&
                  AppBskyFeedDefs.validateThreadViewPost(
                    post.data.thread.parent,
                  ).success
                    ? {
                        reply: {
                          parent: post.data.thread.parent.post,
                          // not technically correct but we don't use this field
                          root: post.data.thread.parent.post,
                        } as AppBskyFeedDefs.ReplyRef,
                      }
                    : {}),
                } satisfies AppBskyFeedDefs.FeedViewPost;
              }),
          );
          return {
            feed: likes.filter((like): like is AppBskyFeedDefs.FeedViewPost =>
              Boolean(like),
            ),
            cursor: list.cursor,
          };
        case "feeds":
          console.error("ERROR: UNREACHABLE CODE REACHED");
          console.log("mode", mode);
          throw new Error("unreachable");
      }
    },
    enabled: mode !== "feeds",
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(() =>
    Promise.all([timeline.refetch(), profile.refetch(), feeds.refetch()]),
  );

  const timelineData = useMemo(() => {
    if (!timeline.data) return [];
    if (mode === "feeds") return [];
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
        }
      })
      .flat();
  }, [timeline, mode, contentFilter]);

  const feedsData = useMemo(() => {
    if (!feeds.data) return [];
    return feeds.data.pages.flatMap((page) => page.feeds);
  }, [feeds]);

  useTabPressScroll(ref);

  const tabs = (offset: boolean) => (
    <Tabs style={{ marginTop: offset ? tabOffset : 0 }}>
      <Tab
        text="Posts"
        active={mode === "posts"}
        onPress={() =>
          mode === "posts"
            ? ref.current?.scrollToIndex({
                index: 0,
                animated: true,
              })
            : setMode("posts")
        }
      />
      <Tab
        text="Posts & Replies"
        active={mode === "replies"}
        onPress={() =>
          mode === "replies"
            ? ref.current?.scrollToIndex({
                index: 0,
                animated: true,
              })
            : setMode("replies")
        }
      />
      <Tab
        text="Likes"
        active={mode === "likes"}
        onPress={() =>
          mode === "likes"
            ? ref.current?.scrollToIndex({
                index: 0,
                animated: true,
              })
            : setMode("likes")
        }
      />
      {feedsData.length > 0 && (
        <Tab
          text="Feeds"
          active={mode === "feeds"}
          onPress={() =>
            mode === "feeds"
              ? ref.current?.scrollToIndex({
                  index: 0,
                  animated: true,
                })
              : setMode("feeds")
          }
        />
      )}
    </Tabs>
  );

  if (profile.data) {
    const info = <ProfileInfo profile={profile.data} backButton={header} />;
    let content = null;
    if (!preferences.data) {
      content = <QueryWithoutData query={preferences} />;
    } else if (profile.data.viewer?.blocking) {
      content = (
        <>
          {info}
          <View className="flex-1 flex-col items-center justify-center p-4">
            <XOctagon size={50} color="#888888" />
            <Text className="my-4 text-center text-lg">
              You have blocked this user
            </Text>
            <Button
              variant="outline"
              onPress={async () => {
                await agent.app.bsky.graph.block.delete({
                  repo: agent.session.did,
                  rkey: profile.data.viewer!.blocking!.split("/").pop(),
                }),
                  await queryClient.refetchQueries(["profile", handle]);
                Alert.alert("Unblocked", "This user has been unblocked");
              }}
            >
              Unblock
            </Button>
          </View>
        </>
      );
    } else if (profile.data.viewer?.blockedBy) {
      content = (
        <>
          {info}
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-center text-lg">
              You have been blocked by this user
            </Text>
          </View>
        </>
      );
    } else {
      switch (mode) {
        case "posts":
        case "replies":
        case "likes":
          content = (
            <FlashList<(typeof timelineData)[number] | null>
              ref={ref}
              data={[null, ...timelineData]}
              renderItem={({ item, index, target }) =>
                item === null ? (
                  tabs(target === "StickyHeader" && header)
                ) : (
                  <FeedPost
                    {...item}
                    // TODO: investigate & fix error with isReply logic below
                    isReply={
                      mode === "replies" && timelineData[index]?.hasReply
                    }
                    inlineParent={mode !== "replies"}
                    dataUpdatedAt={timeline.dataUpdatedAt}
                  />
                )
              }
              stickyHeaderIndices={atTop ? [] : [0]}
              onEndReachedThreshold={0.6}
              onEndReached={() => void timeline.fetchNextPage()}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void handleRefresh()}
                  tintColor={tintColor}
                />
              }
              estimatedItemSize={91}
              onScroll={(evt) => {
                const { contentOffset } = evt.nativeEvent;
                setAtTop(contentOffset.y <= 30);
              }}
              ListHeaderComponent={info}
              ListFooterComponent={
                timeline.isFetching ? (
                  <View className="w-full items-center py-8">
                    <ActivityIndicator />
                  </View>
                ) : (
                  <View className="py-16">
                    <Text className="text-center">That&apos;s everything!</Text>
                  </View>
                )
              }
              extraData={timeline.dataUpdatedAt}
            />
          );
          break;
        case "feeds":
          content = (
            <FlashList<AppBskyFeedDefs.GeneratorView | null>
              ref={ref}
              data={[null, ...feedsData]}
              renderItem={({ item, target }) =>
                item === null ? (
                  tabs(target === "StickyHeader" && header)
                ) : (
                  <Feed {...item} dataUpdatedAt={feeds.dataUpdatedAt} />
                )
              }
              stickyHeaderIndices={atTop ? [] : [0]}
              onEndReachedThreshold={0.6}
              onEndReached={() => void feeds.fetchNextPage()}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void handleRefresh()}
                  tintColor={tintColor}
                />
              }
              estimatedItemSize={91}
              onScroll={(evt) => {
                const { contentOffset } = evt.nativeEvent;
                setAtTop(contentOffset.y <= 30);
              }}
              ListHeaderComponent={info}
              ListFooterComponent={
                feeds.isFetching ? (
                  <View className="w-full items-center py-8">
                    <ActivityIndicator />
                  </View>
                ) : (
                  <View className="py-16">
                    <Text className="text-center">That&apos;s everything!</Text>
                  </View>
                )
              }
              extraData={feeds.dataUpdatedAt}
            />
          );
      }
    }
    return (
      <>
        <SafeAreaView
          className="w-full"
          style={{ backgroundColor: theme.colors.card }}
          edges={["top"]}
          mode="padding"
        />
        <Stack.Screen
          options={{
            headerTransparent: true,
            headerTitle: "",
            headerStyle: {
              backgroundColor: theme.colors.card,
            },
            headerShown: header && !atTop,
          }}
        />
        {content}
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <QueryWithoutData query={profile} />
    </>
  );
};

const Feed = ({
  displayName,
  avatar,
  creator,
  uri,
  description,
}: AppBskyFeedDefs.GeneratorView) => {
  const href = `/profile/${creator.did}/generator/${uri.split("/").pop()}`;
  return (
    <Link href={href} asChild>
      <TouchableOpacity>
        <View className="flex-row items-center border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-700 dark:bg-black">
          <Image
            alt={displayName}
            source={{ uri: avatar }}
            className="h-10 w-10 rounded bg-blue-500"
          />
          <View className="flex-1 px-3">
            <Text className="text-base font-medium dark:text-white">
              {displayName}
            </Text>
            {description && (
              <Text className="text-sm text-neutral-400" numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>
          <ChevronRight
            size={20}
            className="text-neutral-400 dark:text-neutral-200"
          />
        </View>
      </TouchableOpacity>
    </Link>
  );
};
