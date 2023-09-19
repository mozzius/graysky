import {
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, Stack } from "expo-router";
import { type AppBskyFeedGetFeedGenerator } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { type DefinedUseQueryResult } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react-native";

import { useTabPressScrollRef } from "~/lib/hooks";
import { useFeedInfo, useTimeline, type TimelineItem } from "~/lib/hooks/feeds";
import { useUserRefresh } from "~/lib/utils/query";
import { FeedPost } from "../feed-post";
import { FeedsButton } from "../feeds-button";
import { QueryWithoutData } from "../query-without-data";
import { Text } from "../text";

interface Props {
  feed: string;
  showFeedInfo?: boolean;
}

export const FeedScreen = ({ feed }: Props) => {
  const theme = useTheme();
  const { timeline, data, preferences } = useTimeline(feed);
  const info = useFeedInfo(feed);

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    timeline.refetch,
  );

  const [ref, onScroll] = useTabPressScrollRef<TimelineItem>(timeline.refetch);

  if (!info.data)
    return (
      <>
        <Stack.Screen options={{ title: "" }} />
        <QueryWithoutData query={info} />
      </>
    );

  if (!preferences.data)
    return (
      <Wrapper info={info}>
        <QueryWithoutData query={preferences} />
      </Wrapper>
    );

  if (timeline.data) {
    return (
      <Wrapper info={info}>
        <FlashList<TimelineItem>
          ref={ref}
          onScroll={onScroll}
          data={data}
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
          // ListHeaderComponent={
          //   <View className="w-full border-t border-neutral-200 dark:border-neutral-800" />
          // }
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
          extraData={timeline.dataUpdatedAt}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <View className="w-3/4 flex-col items-start">
                <Text className="mb-2 text-2xl font-medium">
                  Looks like there&apos;s nothing here yet!
                </Text>
                <Text className="text-lg">
                  Follow people, and their posts will show up here
                </Text>
                <Link asChild href="/search">
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
            </View>
          }
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper info={info}>
      <QueryWithoutData query={timeline} />
    </Wrapper>
  );
};

const Wrapper = ({
  info,
  children,
}: {
  info: DefinedUseQueryResult<AppBskyFeedGetFeedGenerator.OutputSchema>;
  children: React.ReactNode;
}) => {
  return (
    <>
      <Stack.Screen
        options={{
          title: info.data.view.displayName,
        }}
      />
      {children}
      <FeedsButton />
    </>
  );
};

// const HeaderUnderlay = ({
//   large,
//   absolute,
// }: {
//   large?: boolean;
//   absolute?: boolean;
// }) => (
//   <SafeAreaView
//     edges={["top"]}
//     mode="padding"
//     className={cx(
//       "-z-10 w-full bg-white dark:bg-black",
//       absolute && "absolute top-0",
//     )}
//   >
//     <View
//       style={{
//         height: (Platform.OS === "ios" ? (large ? 96 : 44) : 56) + 1,
//       }}
//     />
//   </SafeAreaView>
// );
