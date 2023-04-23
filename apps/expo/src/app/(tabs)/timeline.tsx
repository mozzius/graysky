import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { AppBskyFeedDefs } from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";

import { Button } from "../../components/button";
import { FeedPost } from "../../components/feed-post";
import { Tab, Tabs } from "../../components/tabs";
import { useAuthedAgent } from "../../lib/agent";
import { assert } from "../../lib/utils/assert";

const actorFromPost = (item: AppBskyFeedDefs.FeedViewPost) => {
  if (AppBskyFeedDefs.isReasonRepost(item.reason)) {
    assert(AppBskyFeedDefs.validateReasonRepost(item.reason));
    return item.reason.by.did;
  } else {
    return item.post.author.did;
  }
};

export default function Timeline() {
  const [mode, setMode] = useState<"popular" | "following" | "mutuals">(
    "following",
  );
  const agent = useAuthedAgent();
  const ref = useRef<FlashList<any>>(null);

  const timeline = useInfiniteQuery({
    queryKey: ["timeline", mode],
    queryFn: async ({ pageParam }) => {
      switch (mode) {
        case "popular":
          const popular = await agent.app.bsky.unspecced.getPopular({
            cursor: pageParam as string | undefined,
          });
          return popular.data;
        case "following":
          const following = await agent.getTimeline({
            cursor: pageParam as string | undefined,
          });
          return following.data;
        case "mutuals":
          const all = await agent.getTimeline({
            cursor: pageParam as string | undefined,
          });
          const actors = new Set<string>();
          for (const item of all.data.feed) {
            const actor = actorFromPost(item);
            actors.add(actor);
          }
          const profiles = await agent.getProfiles({ actors: [...actors] });
          return {
            feed: all.data.feed.filter((item) => {
              const actor = actorFromPost(item);
              const profile = profiles.data.profiles.find(
                (profile) => profile.did === actor,
              );
              if (!profile) return false;
              return profile.viewer?.following && profile.viewer?.followedBy;
            }),
            cursor: all.data.cursor,
          };
      }
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const data = useMemo(() => {
    if (timeline.status !== "success") return [];
    const flattened = timeline.data.pages.flatMap((page) => page.feed);
    return flattened
      .map((item, i, arr) =>
        // if the preview item is replying to this one, skip
        // arr[i - 1]?.reply?.parent?.cid === item.cid
        //   ? [] :
        item.reply && !item.reason
          ? [
              { item: { post: item.reply.parent }, hasReply: true },
              { item, hasReply: false },
            ]
          : [{ item, hasReply: false }],
      )
      .flat();
  }, [timeline]);

  const header = (
    <>
      <Stack.Screen options={{ headerShown: true }} />
      <Tabs>
        <Tab
          text="Following"
          active={mode === "following"}
          onPress={() =>
            mode === "following"
              ? ref.current?.scrollToIndex({ index: 0, animated: true })
              : setMode("following")
          }
        />
        <Tab
          text="What's Hot"
          active={mode === "popular"}
          onPress={() =>
            mode === "popular"
              ? ref.current?.scrollToIndex({ index: 0, animated: true })
              : setMode("popular")
          }
        />
        <Tab
          text="Mutuals"
          active={mode === "mutuals"}
          onPress={() =>
            mode === "mutuals"
              ? ref.current?.scrollToIndex({ index: 0, animated: true })
              : setMode("mutuals")
          }
        />
      </Tabs>
    </>
  );

  switch (timeline.status) {
    case "loading":
      return (
        <>
          {header}
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        </>
      );

    case "error":
      return (
        <>
          {header}
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-center text-xl">
              {(timeline.error as Error).message || "An error occurred"}
            </Text>
            <Button variant="outline" onPress={() => void timeline.refetch()}>
              Retry
            </Button>
          </View>
        </>
      );

    case "success":
      return (
        <>
          {header}
          <FlashList
            ref={ref}
            data={data}
            renderItem={({ item: { hasReply, item } }) => (
              <FeedPost item={item} hasReply={hasReply} />
            )}
            onEndReachedThreshold={0.5}
            onEndReached={() => void timeline.fetchNextPage()}
            onRefresh={() => {
              if (!timeline.isRefetching) void timeline.refetch();
            }}
            refreshing={timeline.isRefetching}
            estimatedItemSize={91}
            ListFooterComponent={
              timeline.isFetching ? (
                <View className="w-full items-center py-4">
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
        </>
      );
  }
}
