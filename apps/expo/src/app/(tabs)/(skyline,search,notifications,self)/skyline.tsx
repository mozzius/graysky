/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  View,
  useColorScheme as useNativeColorScheme,
} from "react-native";
import { TabBar, TabView, type TabBarProps } from "react-native-tab-view";
import { Link, Stack } from "expo-router";
import { AppBskyFeedDefs } from "@atproto/api";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { Avatar } from "../../../components/avatar";
import { ComposeButton } from "../../../components/compose-button";
import { useDrawer } from "../../../components/drawer-content";
import { FeedPost } from "../../../components/feed-post";
import { QueryWithoutData } from "../../../components/query-without-data";
import { useAuthedAgent } from "../../../lib/agent";
import { useBookmarks, useTabPressScroll } from "../../../lib/hooks";
import { useUserRefresh } from "../../../lib/utils/query";

const useTimeline = (algorithm: string) => {
  const agent = useAuthedAgent();

  const timeline = useInfiniteQuery({
    queryKey: ["timeline", algorithm],
    queryFn: async ({ pageParam }) => {
      if (algorithm === "following") {
        const following = await agent.getTimeline({
          cursor: pageParam as string | undefined,
        });
        if (!following.success) throw new Error("Failed to fetch feed");
        return following.data;
      } else {
        // const generator = await agent.app.bsky.feed.getFeedGenerator({
        //   feed: algorithm,
        // });
        // if (!generator.success)
        //   throw new Error("Failed to fetch feed generator");
        // console.log(generator.data);
        // if (!generator.data.isOnline || !generator.data.isValid) {
        //   throw new Error(
        //     "This custom feed is not online or may be experiencing issues",
        //   );
        // }
        const feed = await agent.app.bsky.feed.getFeed({
          feed: algorithm,
          cursor: pageParam as string | undefined,
        });
        if (!feed.success) throw new Error("Failed to fetch feed");
        return feed.data;
      }
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const data = useMemo(() => {
    if (!timeline.data) return [];
    const flattened = timeline.data.pages.flatMap((page) => page.feed);
    return flattened
      .map((item) =>
        // if the preview item is replying to this one, skip
        // arr[i - 1]?.reply?.parent?.cid === item.cid
        //   ? [] :
        {
          if (item.reply && !item.reason) {
            if (AppBskyFeedDefs.isBlockedPost(item.reply.parent)) {
              return [];
            } else if (
              AppBskyFeedDefs.isPostView(item.reply.parent) &&
              AppBskyFeedDefs.validatePostView(item.reply.parent).success
            ) {
              return [
                { item: { post: item.reply.parent }, hasReply: true },
                { item, hasReply: false },
              ];
            } else {
              return [{ item, hasReply: false }];
            }
          } else {
            return [{ item, hasReply: false }];
          }
        },
      )
      .flat();
  }, [timeline]);

  return { timeline, data };
};

const SkylinePage = () => {
  const [index, setIndex] = useState(0);
  const headerHeight = useHeaderHeight();

  const bookmarks = useBookmarks();

  const routes = useMemo(() => {
    const routes = [{ key: "following", title: "Following" }];
    if (bookmarks.data) {
      routes.push(
        ...bookmarks.data.map((bookmark) => ({
          key: bookmark.uri,
          title: bookmark.displayName,
        })),
      );
    }
    return routes;
  }, [bookmarks.data]);

  const { colorScheme } = useColorScheme();
  // trigger rerender on theme change
  useNativeColorScheme();

  const backgroundColor = colorScheme === "light" ? "white" : "black";
  const indicatorStyle = colorScheme === "light" ? "black" : "white";
  const activeColor = colorScheme === "light" ? "black" : "white";
  const borderColor =
    colorScheme === "light" ? "transparent" : "rgb(115,115,115)";

  const renderTabBar = useCallback(
    (props: TabBarProps<(typeof routes)[number]>) => (
      <TabBar
        {...props}
        key={colorScheme}
        gap={16}
        style={{
          backgroundColor: backgroundColor,
          paddingHorizontal: 16,
          borderBottomColor: borderColor,
          borderBottomWidth: 1,
        }}
        indicatorStyle={{
          backgroundColor: indicatorStyle,
          marginHorizontal: 16,
        }}
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
        activeColor={activeColor}
        inactiveColor="gray"
        getLabelText={({ route }) => route.title}
        scrollEnabled
      />
    ),
    [activeColor, backgroundColor, indicatorStyle, borderColor, colorScheme],
  );

  return (
    <>
      <View
        className="w-full bg-white dark:bg-black"
        style={{ height: headerHeight }}
      />
      <TabView
        lazy
        key={colorScheme}
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

  if (timeline.data) {
    return (
      <FlashList
        ref={ref}
        data={data}
        renderItem={({ item: { hasReply, item }, index }) => (
          <FeedPost
            item={item}
            hasReply={hasReply}
            isReply={data[index - 1]?.hasReply}
            inlineParent={!data[index - 1]?.hasReply}
            dataUpdatedAt={timeline.dataUpdatedAt}
          />
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => void timeline.fetchNextPage()}
        onRefresh={() => void handleRefresh()}
        refreshing={refreshing}
        estimatedItemSize={180}
        ListFooterComponent={
          timeline.isFetching ? (
            <View className="w-full items-center py-4">
              <ActivityIndicator />
            </View>
          ) : null
        }
        extraData={timeline.dataUpdatedAt}
      />
    );
  }

  return <QueryWithoutData query={timeline} />;
};

export default function Page() {
  const openDrawer = useDrawer();
  return (
    <>
      <Stack.Screen
        options={{
          title: "Skyline",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={openDrawer}>
              <Avatar size="small" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <Link href="/algorithms" asChild>
              <TouchableOpacity>
                <SlidersHorizontal
                  size={24}
                  className="text-black dark:text-white"
                />
              </TouchableOpacity>
            </Link>
          ),
        }}
      />
      <SkylinePage />
      <ComposeButton />
    </>
  );
}
