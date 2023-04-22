import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { AppBskyFeedDefs, AppBskyFeedLike } from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../lib/agent";
import { assert } from "../lib/utils/assert";
import { FeedPost } from "./feed-post";
import { ProfileInfo } from "./profile-info";
import { Tab, Tabs } from "./tabs";

interface Props {
  handle: string;
}

export const ProfileView = ({ handle }: Props) => {
  const [mode, setMode] = useState<"posts" | "replies" | "likes">("posts");
  const [atTop, setAtTop] = useState(true);
  const agent = useAuthedAgent();

  const profile = useQuery(["profile", handle], async () => {
    const profile = await agent.getProfile({
      actor: handle,
    });
    return profile.data;
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
          const { data } = await agent.api.com.atproto.repo.listRecords({
            repo: handle,
            collection: "app.bsky.feed.like",
            limit: 3,
            cursor: pageParam as string | undefined,
          });

          const likes = await Promise.all(
            data.records.map(async (record) => {
              if (!AppBskyFeedLike.isRecord(record.value)) {
                assert(AppBskyFeedLike.validateRecord(record.value));
                console.warn(`Invalid like record ${record.uri}`);
                return null;
              }
              const post = await agent.getPostThread({
                uri: record.value.subject.uri,
                depth: 0,
              });

              if (!AppBskyFeedDefs.isThreadViewPost(post.data.thread)) {
                assert(
                  AppBskyFeedDefs.validateThreadViewPost(post.data.thread),
                );
                console.warn(`Missing post: ${record.value.subject.uri}`);
                return null;
              }
              return post.data.thread;
            }),
          );
          return {
            feed: likes.filter((like): like is AppBskyFeedDefs.FeedViewPost =>
              Boolean(like),
            ),
            cursor: data.cursor,
          };
      }
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const data = useMemo(() => {
    if (timeline.status !== "success") return [];
    const flat = timeline.data.pages.flatMap((page) => page.feed);
    return flat
      .map((item) =>
        mode === "replies" && item.reply
          ? [
              { item: { post: item.reply.parent }, hasReply: true },
              { item, hasReply: false },
            ]
          : [{ item, hasReply: false }],
      )
      .flat();
  }, [timeline, mode]);

  switch (profile.status) {
    case "loading":
      return (
        <View className="flex-1 items-center justify-center">
          <Stack.Screen
            options={{
              headerTitle: "",
              headerTransparent: true,
              headerStyle: {
                backgroundColor: atTop ? "transparent" : undefined,
              },
            }}
          />
          <ActivityIndicator />
        </View>
      );
    case "error":
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Stack.Screen
            options={{
              headerTitle: "",
              headerTransparent: true,
              headerStyle: {
                backgroundColor: atTop ? "transparent" : undefined,
              },
            }}
          />
          <Text className="text-center text-xl">
            {(profile.error as Error).message || "An error occurred"}
          </Text>
        </View>
      );
    case "success":
      return (
        <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
          <Stack.Screen
            options={{
              headerTransparent: true,
              headerTitle: "",
              ...(!atTop
                ? {
                    headerBlurEffect: "systemThinMaterialLight",
                  }
                : {
                    headerStyle: {
                      backgroundColor: atTop ? "transparent" : undefined,
                    },
                  }),
            }}
          />
          <FlashList
            data={[null, ...data]}
            renderItem={({ item }) =>
              item === null ? (
                <Tabs>
                  <Tab
                    text="Posts"
                    active={mode === "posts"}
                    onPress={() => void setMode("posts")}
                  />
                  <Tab
                    text="Posts & Replies"
                    active={mode === "replies"}
                    onPress={() => void setMode("replies")}
                  />
                  <Tab
                    text="Likes"
                    active={mode === "likes"}
                    onPress={() => void setMode("likes")}
                  />
                </Tabs>
              ) : (
                <FeedPost {...item} />
              )
            }
            stickyHeaderIndices={[0]}
            onEndReachedThreshold={0.5}
            onEndReached={() => void timeline.fetchNextPage()}
            onRefresh={() => {
              if (!timeline.isRefetching) void timeline.refetch();
            }}
            refreshing={timeline.isRefetching}
            estimatedItemSize={91}
            onScroll={(evt) => {
              const { contentOffset } = evt.nativeEvent;
              setAtTop(contentOffset.y <= 30);
            }}
            ListHeaderComponent={<ProfileInfo profile={profile.data} />}
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
          />
        </SafeAreaView>
      );
  }
};
