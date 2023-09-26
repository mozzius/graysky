import { useMemo } from "react";
import {
  ActivityIndicator,
  LogBox,
  RefreshControl,
  TouchableOpacity,
  View,
} from "react-native";
import { Tabs } from "react-native-collapsible-tab-view";
import { showToastable } from "react-native-toastable";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRightIcon, HeartIcon, XOctagonIcon } from "lucide-react-native";

import { useAgent } from "~/lib/agent";
import { useTabPressScrollRef } from "~/lib/hooks";
import { cx } from "~/lib/utils/cx";
import { useUserRefresh } from "~/lib/utils/query";
import { Button } from "../../button";
import { QueryWithoutData } from "../../query-without-data";
import { Text } from "../../text";
import { useProfile, useProfileFeeds } from "./hooks";

LogBox.ignoreLogs(["FlashList only supports padding related props"]);

interface Props {
  handle: string;
}

export const ProfileFeeds = ({ handle }: Props) => {
  const agent = useAgent();
  const queryClient = useQueryClient();

  const feeds = useProfileFeeds(handle);
  const profile = useProfile(handle);

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    feeds.refetch,
  );

  const feedsData = useMemo(() => {
    if (!feeds.data) return [];
    return feeds.data.pages.flatMap((page) => page.feeds);
  }, [feeds.data]);

  const [ref, onScroll] = useTabPressScrollRef<(typeof feedsData)[number]>();

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
            showToastable({
              title: "Unblocked",
              message: `@${profile.data.handle} has been unblocked`,
              status: "success",
            });
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
      <Tabs.FlashList<(typeof feedsData)[number]>
        ref={ref}
        onScroll={onScroll}
        data={feedsData}
        renderItem={({ item }) => (
          <Feed {...item} dataUpdatedAt={feeds.dataUpdatedAt} />
        )}
        onEndReachedThreshold={0.6}
        onEndReached={() => void feeds.fetchNextPage()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
        estimatedItemSize={91}
        ListFooterComponent={
          feeds.isFetching ? (
            <View className="w-full items-center py-8">
              <ActivityIndicator />
            </View>
          ) : (
            <View className="py-16">
              <Text className="text-center">That&apos;s everything!</Text>
            </View>
          )
        }
        extraData={feeds.dataUpdatedAt}
      />
    );
  }
};

const Feed = ({
  displayName,
  avatar,
  creator,
  uri,
  description,
  likeCount,
  viewer,
}: AppBskyFeedDefs.GeneratorView) => {
  const theme = useTheme();
  const href = `/profile/${creator.did}/feed/${uri.split("/").pop()}`;
  return (
    <Link href={href} asChild>
      <TouchableOpacity>
        <View
          className={cx(
            "flex-row items-center border-b px-4 py-2",
            theme.dark
              ? "border-neutral-700 bg-black"
              : "border-neutral-200 bg-white",
          )}
        >
          <Image
            alt={displayName}
            source={{ uri: avatar }}
            className="h-10 w-10 rounded bg-blue-500"
          />
          <View className="flex-1 px-3">
            <Text className="text-base font-medium">{displayName}</Text>
            <Text
              className="text-sm text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              <HeartIcon
                fill="currentColor"
                className={
                  viewer?.like
                    ? "text-red-500"
                    : "text-neutral-500 dark:text-neutral-400"
                }
                size={12}
              />{" "}
              <Text className="tabular-nums">{likeCount ?? 0}</Text>
              {description && ` • ${description}`}
            </Text>
          </View>
          <ChevronRightIcon
            size={20}
            className="text-neutral-400 dark:text-neutral-200"
          />
        </View>
      </TouchableOpacity>
    </Link>
  );
};
