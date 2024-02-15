import { useMemo, useState } from "react";
import { View } from "react-native";
import { RefreshControl, TouchableOpacity } from "react-native-gesture-handler";
import { Stack, useLocalSearchParams } from "expo-router";
import { BskyAgent, type AppBskyFeedDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RssIcon } from "lucide-react-native";

import { FeedPost } from "~/components/feed-post";
import { ListFooterComponent } from "~/components/list-footer";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useContentFilter } from "~/lib/hooks/preferences";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { useUserRefresh } from "~/lib/utils/query";

const OPTIONS = [
  "new",
  "hn4",
  "hn10",
  "like10h",
  "like24h",
  "like3d",
  "like7d",
  "random",
] as const;

export default function TagScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  if (!tag) throw new Error("No tag provided");
  const decodedTag = decodeURIComponent(tag);
  const skyfeedAgent = useMemo(() => {
    return new BskyAgent({ service: "https://skyfeed.me" });
  }, []);
  const agent = useAgent();
  const { contentFilter, preferences } = useContentFilter();
  const { showActionSheetWithOptions } = useActionSheet();
  const theme = useTheme();

  const [mode, setMode] = useState<(typeof OPTIONS)[number]>("new");

  const feed = useInfiniteQuery({
    queryKey: ["feed", "tag", decodedTag, mode],
    queryFn: async ({ pageParam }) => {
      const rawPosts = await skyfeedAgent.app.bsky.feed.getFeedSkeleton({
        feed: `at://skyfeed:tags/app.bsky.feed.generator/${decodedTag.toLocaleLowerCase()}-${mode}`,
        cursor: pageParam,
      });
      if (!rawPosts.success) throw new Error("フィードの取得に失敗しました");
      // split to chunks of 25
      const chunks = rawPosts.data.feed.reduce((acc, post, i) => {
        if (i % 25 === 0) acc.push([]);
        acc[acc.length - 1]!.push(post);
        return acc;
      }, [] as AppBskyFeedDefs.SkeletonFeedPost[][]);

      const hydratedPosts = await Promise.all(
        chunks.map(async (chunk) => {
          const posts = await agent.app.bsky.feed.getPosts({
            uris: chunk.map((post) => post.post),
          });
          if (!posts.success) throw new Error("フィードの補給に失敗しました");
          return posts.data.posts;
        }),
      );

      return {
        posts: hydratedPosts.flat(),
        cursor: rawPosts.data.cursor,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const screenOpts = useMemo(() => {
    return (
      <Stack.Screen
        options={{
          title: `#${decodedTag}`,
          headerRight: () => {
            return (
              <TouchableOpacity
                onPress={() => {
                  showActionSheetWithOptions(
                    {
                      options: [
                        ...OPTIONS.map((mode) => getModeName(mode)),
                        "Cancel",
                      ],
                      cancelButtonIndex: OPTIONS.length,
                      title: "投稿の並び替え",
                      ...actionSheetStyles(theme),
                    },
                    (index) => {
                      if (index === undefined || index === OPTIONS.length)
                        return;
                      const selected = OPTIONS[index];
                      if (selected) setMode(selected);
                    },
                  );
                }}
              >
                <Text primary className="text-base">
                  Sort: {getModeName(mode)}
                </Text>
              </TouchableOpacity>
            );
          },
        }}
      />
    );
  }, [mode, decodedTag, theme, showActionSheetWithOptions]);

  const { refetch } = feed;

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(refetch);

  const data = useMemo(() => {
    if (!feed.data) return [];
    const flattened = feed.data.pages.flatMap((page) => page.posts);
    return flattened
      .map((item) => {
        const filter = contentFilter(item.labels);

        if (filter?.visibility === "hide") return [];
        else {
          return [{ item, filter }];
        }
      })
      .flat();
  }, [feed, contentFilter]);

  if (!preferences.data) {
    return (
      <>
        {screenOpts}
        <QueryWithoutData query={preferences} />
      </>
    );
  }

  if (feed.data) {
    return (
      <>
        {screenOpts}
        <FlashList
          data={data}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={({ item: { item, filter } }) => (
            <FeedPost
              filter={filter}
              item={{ post: item }}
              dataUpdatedAt={feed.dataUpdatedAt}
            />
          )}
          onEndReachedThreshold={2}
          onEndReached={() => void feed.fetchNextPage()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
          estimatedItemSize={171}
          ListFooterComponent={
            <ListFooterComponent
              query={feed}
              text="Powered by Skyfeed"
              hideEmptyMessage={data.length === 0}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-3/4 flex-col items-center">
                <RssIcon size={64} color={theme.colors.text} />
                <Text className="mt-8 text-center text-lg">
                  {getModeName(mode)} feed for #{decodedTag} is empty
                </Text>
              </View>
            </View>
          }
        />
      </>
    );
  }

  return (
    <>
      {screenOpts}
      <QueryWithoutData query={feed} />
    </>
  );
}

function getModeName(mode: (typeof OPTIONS)[number]) {
  switch (mode) {
    case "new":
      return "New";
    case "hn4":
      return "ホット";
    case "hn10":
      return "上昇中";
    case "like10h":
      return "トップ (10時間以内)";
    case "like24h":
      return "トップ (24時間以内)";
    case "like3d":
      return "トップ (3日以内)";
    case "like7d":
      return "トップ (7日以内)";
    case "random":
      return "ランダム";
    default:
      throw new Error("無効なモード");
  }
}
