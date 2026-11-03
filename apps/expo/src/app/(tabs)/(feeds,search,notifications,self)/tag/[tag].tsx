import { useCallback, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { type AtUriString } from "@atproto/lex";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { RssIcon } from "lucide-react-native";

import { FeedPost } from "~/components/feed-post";
import { ListFooterComponent } from "~/components/list-footer";
import { Menu } from "~/components/menu";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { createClient, useAgent } from "~/lib/agent";
import { useContentFilter } from "~/lib/hooks/preferences";
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
    return createClient("https://skyfeed.me");
  }, []);
  const agent = useAgent();
  const { contentFilter, preferences } = useContentFilter();
  const theme = useTheme();
  const getModeName = useGetModeName();
  const { _ } = useLingui();

  const [mode, setMode] = useState<(typeof OPTIONS)[number]>("new");

  const feed = useInfiniteQuery({
    queryKey: ["feed", "tag", decodedTag, mode],
    queryFn: async ({ pageParam }) => {
      const rawPosts = await skyfeedAgent.call(app.bsky.feed.getFeedSkeleton, {
        feed: `at://skyfeed:tags/app.bsky.feed.generator/${decodedTag.toLocaleLowerCase()}-${mode}` as AtUriString,
        cursor: pageParam,
      });
      // split to chunks of 25
      const chunks = rawPosts.feed.reduce((acc, post, i) => {
        if (i % 25 === 0) acc.push([]);
        acc[acc.length - 1]!.push(post);
        return acc;
      }, [] as app.bsky.feed.defs.SkeletonFeedPost[][]);

      const hydratedPosts = await Promise.all(
        chunks.map(async (chunk) => {
          const posts = await agent.call(app.bsky.feed.getPosts, {
            uris: chunk.map((post) => post.post),
          });
          return posts.posts;
        }),
      );

      return {
        posts: hydratedPosts.flat(),
        cursor: rawPosts.cursor,
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
              <Menu
                title={_(msg`Sort posts by`)}
                groups={[
                  {
                    key: "sort",
                    items: OPTIONS.map((option) => ({
                      type: "toggle",
                      key: option,
                      label: getModeName(option),
                      checked: mode === option,
                      onCheckedChange: (checked) => checked && setMode(option),
                    })),
                  },
                ]}
              >
                <Text primary className="text-base">
                  <Trans>Sort: {getModeName(mode)}</Trans>
                </Text>
              </Menu>
            );
          },
        }}
      />
    );
  }, [mode, decodedTag, getModeName, _]);

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
    const modeName = getModeName(mode);
    return (
      <>
        {screenOpts}
        <FlashList
          removeClippedSubviews
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
          ListFooterComponent={
            <ListFooterComponent
              query={feed}
              text={_(msg`Powered by Skyfeed`)}
              hideEmptyMessage={data.length === 0}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-3/4 flex-col items-center">
                <RssIcon size={64} color={theme.colors.text} />
                <Text className="mt-8 text-center text-lg">
                  <Trans>
                    {modeName} feed for #{decodedTag} is empty
                  </Trans>
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

function useGetModeName() {
  const { _ } = useLingui();
  return useCallback(
    (mode: (typeof OPTIONS)[number]) => {
      switch (mode) {
        case "new":
          return _(msg`New`);
        case "hn4":
          return _(msg`Hot`);
        case "hn10":
          return _(msg`Rising`);
        case "like10h":
          return _(msg`Top (10h)`);
        case "like24h":
          return _(msg`Top (24h)`);
        case "like3d":
          return _(msg`Top (3d)`);
        case "like7d":
          return _(msg`Top (7d)`);
        case "random":
          return _(msg`Random`);
        default:
          throw new Error(_(msg`Invalid mode`));
      }
    },
    [_],
  );
}
