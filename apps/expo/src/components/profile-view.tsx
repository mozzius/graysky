import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { AppBskyFeedDefs, AppBskyFeedLike } from "@atproto/api";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { XOctagon } from "lucide-react-native";

import { useAuthedAgent } from "../lib/agent";
import { useTabPressScroll } from "../lib/hooks";
import { assert } from "../lib/utils/assert";
import { useColorScheme } from "../lib/utils/color-scheme";
import { useUserRefresh } from "../lib/utils/query";
import { Button } from "./button";
import { FeedPost } from "./feed-post";
import { ProfileInfo } from "./profile-info";
import { QueryWithoutData } from "./query-without-data";
import { Tab, Tabs } from "./tabs";

interface Props {
  handle: string;
  header?: boolean;
}

export const ProfileView = ({ handle, header = true }: Props) => {
  const [mode, setMode] = useState<"posts" | "replies" | "likes">("posts");
  const [atTop, setAtTop] = useState(true);
  const agent = useAuthedAgent();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<FlashList<any>>(null);
  const headerHeight = useHeaderHeight();
  const { top } = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const tabOffset = headerHeight - top;
  const { colorScheme } = useColorScheme();
  const backgroundColor = colorScheme === "light" ? "#FFF" : "#000";

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
            // smaller limit since we have to fetch each post
            limit: 10,
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

              // convert thread view post to feed view post
              return {
                post: post.data.thread.post,
                ...(AppBskyFeedDefs.isThreadViewPost(post.data.thread.parent) &&
                AppBskyFeedDefs.validateThreadViewPost(post.data.thread.parent)
                  .success
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
            cursor: data.cursor,
          };
      }
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const { refreshing, handleRefresh } = useUserRefresh(() =>
    Promise.all([timeline.refetch(), profile.refetch()]),
  );

  const data = useMemo(() => {
    if (!timeline.data) return [];
    const flat = timeline.data.pages.flatMap((page) => page.feed);
    return flat
      .map((item) => {
        switch (mode) {
          case "posts":
            return item.reply && !item.reason
              ? []
              : [{ item, hasReply: false }];
          case "replies":
            return item.reply && !item.reason
              ? [
                  { item: { post: item.reply.parent }, hasReply: true },
                  { item, hasReply: false },
                ]
              : [{ item, hasReply: false }];
          case "likes":
            return [{ item, hasReply: false }];
        }
      })
      .flat();
  }, [timeline, mode]);

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
    </Tabs>
  );

  if (profile.data) {
    const info = <ProfileInfo profile={profile.data} backButton={header} />;
    let content = null;
    if (profile.data.viewer?.blocking) {
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
      content = (
        <FlashList
          ref={ref}
          data={[null, ...data]}
          renderItem={({ item, index, target }) =>
            item === null ? (
              tabs(target === "StickyHeader" && header)
            ) : (
              <FeedPost
                {...item}
                // TODO: investigate & fix error with isReply logic below
                isReply={mode === "replies" && data[index]?.hasReply}
                inlineParent={mode !== "replies"}
                dataUpdatedAt={timeline.dataUpdatedAt}
              />
            )
          }
          stickyHeaderIndices={atTop ? [] : [0]}
          onEndReachedThreshold={0.5}
          onEndReached={() => void timeline.fetchNextPage()}
          onRefresh={() => void handleRefresh()}
          refreshing={refreshing}
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
    }
    return (
      <>
        <SafeAreaView
          className="w-full bg-white dark:bg-black"
          edges={["top"]}
          mode="padding"
        />
        <Stack.Screen
          options={{
            headerTransparent: true,
            headerTitle: "",
            headerStyle: {
              backgroundColor: backgroundColor,
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
