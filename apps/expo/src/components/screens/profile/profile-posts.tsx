import {
  ActivityIndicator,
  LogBox,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Tabs } from "react-native-collapsible-tab-view";

import { useTabPressScrollRef } from "~/lib/hooks";
import { useUserRefresh } from "~/lib/utils/query";
import { FeedPost } from "../../feed-post";
import { QueryWithoutData } from "../../query-without-data";
import { useProfile, useProfilePosts } from "./hooks";

LogBox.ignoreLogs(["FlashList only supports padding related props"]);

// vendored react-merge-refs due to import issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeRefs<T = any>(
  refs: (React.MutableRefObject<T> | React.LegacyRef<T>)[],
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

interface Props {
  handle: string;
  mode: "posts" | "replies" | "likes" | "media";
}

export const ProfilePosts = ({ handle, mode }: Props) => {
  const { preferences, timeline, timelineData } = useProfilePosts(mode, handle);

  const profile = useProfile(handle);

  const [ref, onScroll] = useTabPressScrollRef<(typeof timelineData)[number]>(
    timeline.refetch,
  );

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    timeline.refetch,
  );

  if (!preferences.data) {
    return <QueryWithoutData query={preferences} />;
  }

  if (!profile.data) {
    return <QueryWithoutData query={profile} />;
  }

  if (profile.data.viewer?.blocking) {
    return null;
  } else if (profile.data.viewer?.blockedBy) {
    return null;
  } else {
    return (
      <Tabs.FlashList<(typeof timelineData)[number]>
        ref={ref}
        onScroll={onScroll}
        data={timelineData}
        renderItem={({ item, index }) => (
          <FeedPost
            {...item}
            // TODO: investigate & fix error with isReply logic below
            isReply={mode === "replies" && timelineData[index - 1]?.hasReply}
            inlineParent={mode !== "replies"}
            dataUpdatedAt={timeline.dataUpdatedAt}
          />
        )}
        onEndReachedThreshold={0.6}
        onEndReached={() => timeline.fetchNextPage()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
        estimatedItemSize={91}
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
};
