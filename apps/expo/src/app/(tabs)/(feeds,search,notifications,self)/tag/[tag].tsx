import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { RefreshControl, TouchableOpacity } from "react-native-gesture-handler";
import { Stack, useLocalSearchParams } from "expo-router";
import { BskyAgent, type AppBskyFeedDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RssIcon } from "lucide-react-native";

import { FeedPost } from "~/components/feed-post";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/text";
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
        cursor: pageParam as string | undefined,
      });
      if (!rawPosts.success) throw new Error("Failed to fetch feed");
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
          if (!posts.success) throw new Error("Failed to hydrate feed");
          return posts.data.posts;
        }),
      );

      return {
        posts: hydratedPosts.flat(),
        cursor: rawPosts.data.cursor,
      };
    },
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
                <Text
                  style={{ color: theme.colors.primary }}
                  className="text-lg"
                >
                  Sort: {getModeName(mode)}{" "}
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
          onEndReachedThreshold={0.6}
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
            feed.isFetching ? (
              <View className="w-full flex-col items-center justify-center py-8">
                <ActivityIndicator />
                <Text className="mt-4 text-center text-sm text-neutral-400">
                  Powered by Skyfeed
                </Text>
              </View>
            ) : data.length > 0 ? (
              <View className="py-16">
                <Text className="text-center">That&apos;s everything!</Text>
              </View>
            ) : (
              <></>
            )
          }
          extraData={feed.dataUpdatedAt}
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
      return "Hot";
    case "hn10":
      return "Rising";
    case "like10h":
      return "Top (10h)";
    case "like24h":
      return "Top (24h)";
    case "like3d":
      return "Top (3d)";
    case "like7d":
      return "Top (7d)";
    case "random":
      return "Random";
    default:
      throw new Error("Invalid mode");
  }
}
