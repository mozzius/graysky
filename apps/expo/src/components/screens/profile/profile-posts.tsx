import {
  ActivityIndicator,
  Alert,
  LogBox,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useScrollProps } from "@bacons/expo-router-top-tabs";
import { AnimatedFlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { XOctagonIcon } from "lucide-react-native";

import { useAgent } from "../../../lib/agent";
import { useUserRefresh } from "../../../lib/utils/query";
import { Button } from "../../button";
import { FeedPost } from "../../feed-post";
import { QueryWithoutData } from "../../query-without-data";
import { useProfile, useProfilePosts } from "./hooks";

LogBox.ignoreLogs(["FlashList only supports padding related props"]);

// vendored react-merge-refs due to import issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>,
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
  const agent = useAgent();
  const queryClient = useQueryClient();

  const { preferences, timeline, timelineData } = useProfilePosts(mode, handle);

  const profile = useProfile(handle);

  const props = useScrollProps();

  // const ref = useAnimatedRef<Animated.ScrollView>();
  // useAnimatedTabPressScroll(ref);

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
    return (
      <View className="flex-1 flex-col items-center justify-center p-4">
        <XOctagonIcon size={50} color="#888888" />
        <Text className="my-4 text-center text-lg">
          You have blocked this user
        </Text>
        <Button
          variant="outline"
          onPress={async () => {
            await agent.app.bsky.graph.block.delete({
              repo: agent.session!.did,
              rkey: profile.data.viewer!.blocking!.split("/").pop(),
            });
            void queryClient.refetchQueries(["profile", handle]);
            Alert.alert("Unblocked", "This user has been unblocked");
          }}
        >
          Unblock
        </Button>
      </View>
    );
  } else if (profile.data.viewer?.blockedBy) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-center text-lg">
          You have been blocked by this user
        </Text>
      </View>
    );
  } else {
    return (
      <AnimatedFlashList
        {...props}
        // renderScrollComponent={(props) => (
        //   <Animated.ScrollView ref={ref} {...props} />
        // )}
        data={timelineData}
        renderItem={({ item, index }) => (
          <FeedPost
            {...item}
            // TODO: investigate & fix error with isReply logic below
            isReply={mode === "replies" && timelineData[index - 1]?.hasReply}
            inlineParent={mode !== "replies"}
            dataUpdatedAt={timeline.dataUpdatedAt}
            index={index}
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
