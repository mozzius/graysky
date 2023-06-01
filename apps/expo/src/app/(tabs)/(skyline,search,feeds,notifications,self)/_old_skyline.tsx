/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  View,
} from "react-native";
import { TabBar, TabView, type TabBarProps } from "react-native-tab-view";
import { Link, Stack } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { SlidersHorizontal } from "lucide-react-native";

import { Avatar } from "../../../components/avatar";
import { ComposeButton } from "../../../components/compose-button";
import { useDrawer } from "../../../components/drawer-content";
import { FeedPost } from "../../../components/feed-post";
import { QueryWithoutData } from "../../../components/query-without-data";
import { useSavedFeeds, useTabPressScroll } from "../../../lib/hooks";
import { useTimeline } from "../../../lib/hooks/feeds";
import { useColorScheme } from "../../../lib/utils/color-scheme";
import { useUserRefresh } from "../../../lib/utils/query";

const SkylinePage = () => {
  const [index, setIndex] = useState(0);
  const headerHeight = useHeaderHeight();

  const savedFeeds = useSavedFeeds({ pinned: true });

  const routes = useMemo(() => {
    const routes = [{ key: "following", title: "Following" }];
    if (savedFeeds.data) {
      routes.push(
        ...savedFeeds.data.feeds.map((feed) => ({
          key: feed.uri,
          title: feed.displayName,
        })),
      );
    }
    return routes;
  }, [savedFeeds.data]);

  const { colorScheme } = useColorScheme();

  const backgroundColor = colorScheme === "light" ? "white" : "black";
  const indicatorStyle = colorScheme === "light" ? "black" : "white";
  const activeColor = colorScheme === "light" ? "black" : "white";
  const borderColor =
    colorScheme === "light" ? "transparent" : "rgb(115,115,115)";

  const renderTabBar = useCallback(
    (props: TabBarProps<(typeof routes)[number]>) => (
      <TabBar
        {...props}
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
    [activeColor, backgroundColor, indicatorStyle, borderColor],
  );

  if (index >= routes.length) {
    setIndex(0);
  }

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
        renderScene={({ route }) => <Feed mode={route.key} />}
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
  mode: string;
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
