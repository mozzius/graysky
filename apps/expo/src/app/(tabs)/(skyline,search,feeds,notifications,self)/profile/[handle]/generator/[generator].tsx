import { useRef } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";

import { FeedPost } from "../../../../../../components/feed-post";
import { QueryWithoutData } from "../../../../../../components/query-without-data";
import { useTabPressScrollRef } from "../../../../../../lib/hooks";
import { useTimeline } from "../../../../../../lib/hooks/feeds";
import { useUserRefresh } from "../../../../../../lib/utils/query";

const Feed = () => {
  const { handle, generator } = useLocalSearchParams();

  const { timeline, data } = useTimeline(
    `at://${handle}/app.bsky.feed.generator/${generator}`,
  );

  const { refreshing, handleRefresh } = useUserRefresh(timeline.refetch);

  const ref = useTabPressScrollRef(timeline.refetch);

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
        estimatedItemSize={91}
        ListHeaderComponent={() => (
          <View>
            <Text className="text-2xl">{generator}</Text>
          </View>
        )}
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
    );
  }

  return <QueryWithoutData query={timeline} />;
};

export default function FeedPage() {
  return (
    <>
      <Stack.Screen options={{ title: "Feed" }} />
      <Feed />
    </>
  );
}
