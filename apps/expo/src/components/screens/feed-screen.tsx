import { useCallback, useState } from "react";
import { RefreshControl, TouchableOpacity, View } from "react-native";
import { Link, Stack } from "expo-router";
import { type AppBskyFeedGetFeedGenerator } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { type DefinedUseQueryResult } from "@tanstack/react-query";
import { RssIcon, SearchIcon } from "lucide-react-native";

import { useTabPressScrollRef } from "~/lib/hooks";
import { useFeedInfo, useTimeline, type TimelineItem } from "~/lib/hooks/feeds";
import { useHaptics } from "~/lib/hooks/preferences";
import { useUserRefresh } from "~/lib/utils/query";
import { FeedPost } from "../feed-post";
import { FeedsButton } from "../feeds-button";
import { ListFooterComponent } from "../list-footer";
import { QueryWithoutData } from "../query-without-data";
import { Text } from "../themed/text";

interface Props {
  feed: string;
  showFeedInfo?: boolean;
}

export const FeedScreen = ({ feed }: Props) => {
  const theme = useTheme();
  const { timeline, data, preferences } = useTimeline(feed);
  const info = useFeedInfo(feed);
  const haptics = useHaptics();
  const [scrollDir, setScrollDir] = useState(0);

  const { refetch } = timeline;

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(refetch);

  // consider adding activity indicator to header like notifications screen
  const [ref, onScroll] = useTabPressScrollRef<TimelineItem>(
    useCallback(() => {
      async () => {
        haptics.selection();
        await refetch();
      };
    }, [haptics, refetch]),
    { setScrollDir },
  );

  if (!info.data)
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <QueryWithoutData query={info} />
      </>
    );

  if (!preferences.data)
    return (
      <Wrapper info={info} scrollDir={scrollDir}>
        <QueryWithoutData query={preferences} />
      </Wrapper>
    );

  if (timeline.data) {
    return (
      <Wrapper info={info} scrollDir={scrollDir}>
        <FlashList<TimelineItem>
          ref={ref}
          onScroll={onScroll}
          data={data}
          contentInsetAdjustmentBehavior="automatic"
          renderItem={({ item: { hasReply, item, filter }, index }) => (
            <FeedPost
              filter={filter}
              item={item}
              hasReply={hasReply}
              isReply={data[index - 1]?.hasReply}
              inlineParent={!data[index - 1]?.hasReply}
              dataUpdatedAt={timeline.dataUpdatedAt}
            />
          )}
          onEndReachedThreshold={0.6}
          onEndReached={() => void timeline.fetchNextPage()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
          estimatedItemSize={171}
          ListFooterComponent={<ListFooterComponent query={timeline} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              {feed === "following" ? (
                <View className="w-3/4 flex-col items-start">
                  <Text className="mb-2 text-2xl font-medium">
                    Looks like there&apos;s nothing here yet!
                  </Text>
                  <Text className="text-lg">
                    Follow people, and their posts will show up here
                  </Text>
                  <Link asChild href="/(tabs)/(search)/search">
                    <TouchableOpacity
                      className="mt-8 flex-row items-center rounded-full py-2 pl-4 pr-8"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <SearchIcon size={20} className="text-white" />
                      <Text className="ml-4 text-xl text-white">
                        Find people to follow
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              ) : (
                <View className="w-3/4 flex-col items-center">
                  <RssIcon size={64} color={theme.colors.text} />
                  <Text className="mt-8 text-center text-lg">
                    This feed is empty
                  </Text>
                </View>
              )}
            </View>
          }
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper info={info} scrollDir={scrollDir}>
      <QueryWithoutData query={timeline} />
    </Wrapper>
  );
};

const Wrapper = ({
  info,
  children,
  scrollDir,
}: {
  info: DefinedUseQueryResult<AppBskyFeedGetFeedGenerator.OutputSchema>;
  children: React.ReactNode;
  scrollDir: number;
}) => {
  return (
    <>
      <Stack.Screen
        options={{
          title: info.data.view.displayName,
        }}
      />
      {children}
      {scrollDir <= 0 && <FeedsButton />}
    </>
  );
};
