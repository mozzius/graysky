/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Text, View } from "react-native";
import { TabBar, TabView, type TabBarProps } from "react-native-tab-view";
import { Stack } from "expo-router";
import { AppBskyFeedDefs } from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";

import { Button } from "../../components/button";
import { ComposeButton } from "../../components/compose-button";
import { ComposerProvider } from "../../components/composer";
import { FeedPost } from "../../components/feed-post";
import { useAuthedAgent } from "../../lib/agent";
import { useTabPressScroll } from "../../lib/hooks";
import { assert } from "../../lib/utils/assert";
import { useUserRefresh } from "../../lib/utils/query";

const actorFromPost = (item: AppBskyFeedDefs.FeedViewPost) => {
  if (AppBskyFeedDefs.isReasonRepost(item.reason)) {
    assert(AppBskyFeedDefs.validateReasonRepost(item.reason));
    return item.reason.by.did;
  } else {
    return item.post.author.did;
  }
};

const useTimeline = (mode: "popular" | "following" | "mutuals") => {
  const agent = useAuthedAgent();

  const timeline = useInfiniteQuery({
    queryKey: ["timeline", mode],
    queryFn: async ({ pageParam }) => {
      switch (mode) {
        case "popular": {
          const popular = await agent.app.bsky.unspecced.getPopular({
            cursor: pageParam as string | undefined,
          });
          if (!popular.success) throw new Error("Failed to fetch feed");
          return popular.data;
        }
        case "following": {
          const following = await agent.getTimeline({
            cursor: pageParam as string | undefined,
          });
          if (!following.success) throw new Error("Failed to fetch feed");
          return following.data;
        }
        case "mutuals": {
          const all = await agent.getTimeline({
            cursor: pageParam as string | undefined,
          });

          if (!all.success) throw new Error("Failed to fetch feed");
          const actors = new Set<string>();
          for (const item of all.data.feed) {
            const actor = actorFromPost(item);
            actors.add(actor);
          }
          // split actors into chunks of 25
          // API can only do 25 actors at a time
          const chunks = Array.from(actors).reduce<string[][]>(
            (acc, actor) => {
              if (acc[acc.length - 1]!.length === 25) {
                acc.push([actor]);
              } else {
                acc[acc.length - 1]!.push(actor);
              }
              return acc;
            },
            [[]],
          );
          // fetch profiles for each chunk
          // const profiles = await agent.getProfiles({ actors: [...actors] });
          const profiles = await Promise.all(
            chunks.map((chunk) => agent.getProfiles({ actors: chunk })),
          );
          return {
            feed: all.data.feed.filter((item) => {
              const actor = actorFromPost(item);
              const profile = profiles
                .flatMap((x) => x.data.profiles)
                .find((profile) => profile.did === actor);
              if (!profile) return false;
              return profile.viewer?.following && profile.viewer?.followedBy;
            }),
            cursor: all.data.cursor,
          };
        }
      }
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const data = useMemo(() => {
    if (timeline.status !== "success") return [];
    const flattened = timeline.data.pages.flatMap((page) => page.feed);
    return flattened
      .map((item) =>
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

  return { timeline, data };
};

const routes = [
  { key: "following", title: "Following" },
  { key: "popular", title: "What's Hot" },
  { key: "mutuals", title: "Mutuals" },
];

const TimelinePage = () => {
  const [index, setIndex] = useState(0);
  const headerHeight = useHeaderHeight();

  const renderTabBar = useCallback(
    (props: TabBarProps<(typeof routes)[number]>) => (
      <TabBar
        {...props}
        gap={16}
        style={{ backgroundColor: "white", paddingHorizontal: 16 }}
        indicatorStyle={{ backgroundColor: "black", marginHorizontal: 16 }}
        tabStyle={{
          width: "auto",
          margin: 0,
          paddingVertical: 0,
          paddingHorizontal: 8,
        }}
        labelStyle={{
          textTransform: "none",
          margin: 0,
        }}
        activeColor="black"
        inactiveColor="gray"
        getLabelText={({ route }) => route.title}
      />
    ),
    [],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, headerTransparent: true }} />
      <View className="w-full bg-white" style={{ height: headerHeight }} />
      <TabView
        lazy
        renderTabBar={renderTabBar}
        navigationState={{
          index,
          routes,
        }}
        renderScene={({ route }) => (
          <Feed mode={route.key as "following" | "popular" | "mutuals"} />
        )}
        onIndexChange={setIndex}
        initialLayout={{
          height: 0,
          width: Dimensions.get("window").width,
        }}
      />
    </>
  );
};

interface Props {
  mode: "popular" | "following" | "mutuals";
}

const Feed = ({ mode }: Props) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<FlashList<any>>(null);
  const { timeline, data } = useTimeline(mode);

  const { refreshing, handleRefresh } = useUserRefresh(timeline.refetch);

  useTabPressScroll(ref);

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
          <Text className="mb-4 text-center text-lg">
            {(timeline.error as Error).message || "An error occurred"}
          </Text>
          <Button
            variant="outline"
            onPress={() => void timeline.refetch()}
            className="mt-4"
          >
            Retry
          </Button>
        </View>
      );

    case "success":
      return (
        <>
          <FlashList
            ref={ref}
            data={data}
            renderItem={({ item: { hasReply, item }, index }) => (
              <FeedPost
                item={item}
                hasReply={hasReply}
                isReply={data[index - 1]?.hasReply}
                inlineParent={!data[index - 1]?.hasReply}
              />
            )}
            onEndReachedThreshold={0.5}
            onEndReached={() => void timeline.fetchNextPage()}
            onRefresh={() => void handleRefresh()}
            refreshing={refreshing}
            estimatedItemSize={91}
            ListFooterComponent={
              timeline.isFetching ? (
                <View className="w-full items-center bg-white py-4 dark:bg-black">
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
          <ComposeButton />
        </>
      );
  }
};

export default function Page() {
  return (
    <ComposerProvider>
      <TimelinePage />
    </ComposerProvider>
  );
}
