import { ActivityIndicator, Text, View } from "react-native";
// import { Tabs } from "expo-router";
import { type AppBskyFeedPost } from "@atproto/api";
import { type FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Heart, MessageSquare, Repeat } from "lucide-react-native";

import { Button } from "../../components/button";
import { useAuthedAgent } from "../../lib/agent";

function Timeline() {
  const agent = useAuthedAgent();
  const timeline = useInfiniteQuery({
    queryKey: ["timeline"],
    queryFn: async ({ pageParam }) => {
      const timeline = await agent.getTimeline({
        limit: 5,
        cursor: pageParam as string | undefined,
      });
      return timeline.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  switch (timeline.status) {
    case "loading":
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
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
        <FlashList
          onEndReached={() => void timeline.fetchNextPage()}
          className="flex-1"
          data={timeline.data.pages.flatMap((page) => page.feed)}
          estimatedItemSize={107}
          renderItem={({ item }) => <Post item={item} />}
        />
      );
  }
}

export default function TimelinePage() {
  return (
    <>
      {/* <Tabs.Screen /> */}
      <Timeline />
    </>
  );
}

const Post = ({ item }: { item: FeedViewPost }) => {
  return (
    <View
      className="gap- border border-b border-neutral-200 bg-white p-4"
      // onLayout={(x) => console.log(x.nativeEvent.layout)}
    >
      {void console.log(item.post.embed)}
      <Text className="text-base">
        {item.post.author.displayName}{" "}
        <Text className="text-neutral-400">@{item.post.author.handle}</Text>
      </Text>
      {/* text content */}
      <Text className="text-base">
        {(item.post.record as AppBskyFeedPost.Record).text}
      </Text>
      <View className="flex-row justify-between pt-2">
        <View className="flex-row items-center gap-2">
          <MessageSquare size={16} color="#1C1C1E" />
          <Text>{item.post.replyCount}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Repeat
            size={16}
            color={item.post.viewer?.repost ? "#2563eb" : "#1C1C1E"}
          />
          <Text
            style={{
              color: item.post.viewer?.repost ? "#2563eb" : "#1C1C1E",
            }}
          >
            {item.post.repostCount}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Heart
            size={16}
            fill={item.post.viewer?.like ? "#dc2626" : "transparent"}
            color={item.post.viewer?.like ? "#dc2626" : "#1C1C1E"}
          />
          <Text
            style={{
              color: item.post.viewer?.like ? "#dc2626" : "#1C1C1E",
            }}
          >
            {item.post.likeCount}
          </Text>
        </View>
        <View className="w-8" />
      </View>
    </View>
  );
};
