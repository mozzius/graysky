import { ActivityIndicator, RefreshControl, Text, View } from "react-native";
import { Stack } from "expo-router";
import {
  type AppBskyFeedDefs,
  type AppBskyFeedGetFeedGenerator,
} from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { type DefinedUseQueryResult } from "@tanstack/react-query";

import { useTabPressScrollRef } from "../../lib/hooks";
import { useFeedInfo, useTimeline } from "../../lib/hooks/feeds";
import { type FilterResult } from "../../lib/hooks/preferences";
import { useUserRefresh } from "../../lib/utils/query";
import { FeedPost } from "../feed-post";
import { QueryWithoutData } from "../query-without-data";

interface Props {
  feed: string;
  showFeedInfo?: boolean;
}

export const FeedScreen = ({ feed }: Props) => {
  const { timeline, data, preferences } = useTimeline(feed);
  const info = useFeedInfo(feed);

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    timeline.refetch,
  );

  const ref = useTabPressScrollRef(() => void timeline.refetch());

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
        <FlashList<{
          item: AppBskyFeedDefs.FeedViewPost;
          hasReply: boolean;
          filter: FilterResult;
        }>
          ref={ref}
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
              onRefresh={() => void handleRefresh()}
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
          headerBackTitle:
            info.data.view.displayName === "Following" ? "Feeds" : undefined,
          //   headerRight: () =>
          //     info.data.view.displayName !== "Following" &&
          //     (info.data.isOnline && info.data.isValid ? (
          //       <TouchableOpacity
          //         onPress={() => Alert.alert("Feed Info", "This feed is online")}
          //       >
          //         <Radio size={24} className="text-green-600" />
          //       </TouchableOpacity>
          //     ) : (
          //       <TouchableOpacity
          //         onPress={() =>
          //           Alert.alert(
          //             "Feed Info",
          //             `This feed is ${
          //               info.data.isOnline ? "not valid" : "offline"
          //             }`,
          //             [
          //               {
          //                 text: "Cancel",
          //                 style: "cancel",
          //               },
          //               {
          //                 text: "Retry",
          //                 onPress: () => void info.refetch(),
          //               },
          //             ],
          //           )
          //         }
          //       >
          //         <Radio size={24} className="text-red-600" />
          //       </TouchableOpacity>
          //     )),
        }}
      />
      {children}
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
