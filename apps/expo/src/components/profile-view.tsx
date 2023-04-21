import { useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../lib/agent";
import { FeedPost } from "./feed-post";
import { ProfileInfo } from "./profile-info";

interface Props {
  handle: string;
}

export const ProfileView = ({ handle }: Props) => {
  const [withReplies] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const agent = useAuthedAgent();

  const profile = useQuery(["profile", handle], async () => {
    const profile = await agent.getProfile({
      actor: handle,
    });
    return profile.data;
  });

  const timeline = useInfiniteQuery({
    queryKey: ["profile", handle, "feed"],
    queryFn: async ({ pageParam }) => {
      const timeline = await agent.getAuthorFeed({
        actor: handle,
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
          ? withReplies
            ? [
                { item: { post: item.reply.parent }, hasReply: true },
                { item, hasReply: false },
              ]
            : []
          : [{ item, hasReply: false }],
      )
      .flat()
      .filter(Boolean);
  }, [timeline, withReplies]);

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
            data={data}
            renderItem={({ item: { hasReply, item } }) => (
              <FeedPost item={item} hasReply={hasReply} />
            )}
            onEndReachedThreshold={0.5}
            onEndReached={() => void timeline.fetchNextPage()}
            // onRefresh={() => {
            //   if (!timeline.isRefetching) void timeline.refetch();
            // }}
            // refreshing={timeline.isRefetching}
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
