import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { XOctagon } from "lucide-react-native";

import { useAuthedAgent } from "../../../lib/agent";
import { useTabPressScroll } from "../../../lib/hooks";
import { useUserRefresh } from "../../../lib/utils/query";
import { Button } from "../../button";
import { FeedPost } from "../../feed-post";
import { QueryWithoutData } from "../../query-without-data";
import { useProfile, useProfilePosts } from "./hooks";

interface Props {
  handle: string;
  mode: "posts" | "replies" | "likes" | "media";
}

export const ProfilePosts = ({ handle, mode }: Props) => {
  const [atTop, setAtTop] = useState(true);
  const agent = useAuthedAgent();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<FlashList<any>>(null);
  const queryClient = useQueryClient();

  const { preferences, timeline, timelineData } = useProfilePosts(mode, handle);

  const profile = useProfile(handle);

  const onScroll = useTabPressScroll(ref);

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    timeline.refetch,
  );

  if (!preferences.data) {
    return <QueryWithoutData query={preferences} />;
  }

  if (!profile.data) {
    return <QueryWithoutData query={profile} />;
  }

  if (timeline.data) {
    if (profile.data.viewer?.blocking) {
      return (
        <View className="flex-1 flex-col items-center justify-center p-4">
          <XOctagon size={50} color="#888888" />
          <Text className="my-4 text-center text-lg">
            You have blocked this user
          </Text>
          <Button
            variant="outline"
            onPress={async () => {
              await agent.app.bsky.graph.block.delete({
                repo: agent.session.did,
                rkey: profile.data.viewer!.blocking!.split("/").pop(),
              }),
                await queryClient.refetchQueries(["profile", handle]);
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
        <FlashList<(typeof timelineData)[number]>
          ref={ref}
          data={timelineData}
          renderItem={({ item, index }) => (
            <FeedPost
              {...item}
              // TODO: investigate & fix error with isReply logic below
              isReply={mode === "replies" && timelineData[index]?.hasReply}
              inlineParent={mode !== "replies"}
              dataUpdatedAt={timeline.dataUpdatedAt}
              index={index}
            />
          )}
          stickyHeaderIndices={atTop ? [] : [0]}
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
          onScroll={(evt) => {
            onScroll(evt);
            const { contentOffset } = evt.nativeEvent;
            setAtTop(contentOffset.y <= 30);
          }}
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
  }

  return <QueryWithoutData query={timeline} />;
};
