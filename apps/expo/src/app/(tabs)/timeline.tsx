import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Stack } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";

import { Button } from "../../components/button";
import { FeedPost } from "../../components/feed-post";
import { useAuthedAgent } from "../../lib/agent";

export default function Timeline() {
  const agent = useAuthedAgent();
  const timeline = useInfiniteQuery({
    queryKey: ["timeline"],
    queryFn: async ({ pageParam }) => {
      const timeline = await agent.getTimeline({
        cursor: pageParam as string | undefined,
      });
      return timeline.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const data = useMemo(() => {
    if (timeline.status !== "success") return [];
    const flat = timeline.data.pages.flatMap((page) => page.feed);
    return flat
      .map((item) =>
        item.reply
          ? [
              { item: { post: item.reply.parent }, hasReply: true },
              { item, hasReply: false },
            ]
          : [{ item, hasReply: false }],
      )
      .flat();
  }, [timeline]);

  switch (timeline.status) {
    case "loading":
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      );

    case "error":
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center text-xl">
            {(timeline.error as Error).message || "An error occurred"}
          </Text>
          <Button variant="outline" onPress={() => void timeline.refetch()}>
            Retry
          </Button>
        </View>
      );

    case "success":
      return (
        <>
          <Stack.Screen options={{ headerShown: true }} />
          <FlashList
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
