import { useMemo } from "react";
import { LogBox, RefreshControl, TouchableOpacity, View } from "react-native";
import { Tabs } from "react-native-collapsible-tab-view";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { ChevronRightIcon, HeartIcon } from "lucide-react-native";

import { ListFooterComponent } from "~/components/list-footer";
import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useTabPressScrollRef } from "~/lib/hooks";
import { cx } from "~/lib/utils/cx";
import { useUserRefresh } from "~/lib/utils/query";
import { Text } from "../../themed/text";
import { useProfile, useProfileFeeds } from "./hooks";
import { INITIAL_HEADER_HEIGHT } from "./profile-info";

LogBox.ignoreLogs(["FlashList only supports padding related props"]);

interface Props {
  did: string;
}

export const ProfileFeeds = ({ did }: Props) => {
  const feeds = useProfileFeeds(did);
  const profile = useProfile(did);

  const feedsData = useMemo(() => {
    if (!feeds.data) return [];
    return feeds.data.pages.flatMap((page) => page.feeds);
  }, [feeds.data]);

  const [ref, onScroll] = useTabPressScrollRef<(typeof feedsData)[number]>();

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    feeds.refetch,
  );

  if (profile.data?.viewer?.blocking) {
    return null;
  } else if (profile.data?.viewer?.blockedBy) {
    return null;
  } else {
    return (
      <Tabs.FlashList<(typeof feedsData)[number]>
        removeClippedSubviews
        ref={ref}
        onScroll={onScroll}
        data={feedsData}
        renderItem={({ item }) => (
          <Feed {...item} dataUpdatedAt={feeds.dataUpdatedAt} />
        )}
        onEndReachedThreshold={2}
        onEndReached={() => feeds.fetchNextPage()}
        ListFooterComponent={<ListFooterComponent query={feeds} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
            progressViewOffset={INITIAL_HEADER_HEIGHT}
          />
        }
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
  const path = useAbsolutePath();
  const href = path(`/profile/${creator.did}/feed/${uri.split("/").pop()}`);
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
              <Text style={{ fontVariant: ["tabular-nums"] }}>
                {likeCount ?? 0}
              </Text>
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
