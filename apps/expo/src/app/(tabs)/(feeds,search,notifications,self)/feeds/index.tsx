import { memo, useCallback, useState } from "react";
import { TouchableHighlight, TouchableOpacity, View } from "react-native";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
} from "react-native-draggable-flatlist";
import { Link, Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import {
  ChevronRightIcon,
  CloudIcon,
  CompassIcon,
  PlusIcon,
} from "lucide-react-native";

import { DraggableFeedRow } from "~/components/feed-row";
import { ItemSeparator } from "~/components/item-separator";
import { OpenDrawerAvatar } from "~/components/open-drawer-avatar";
import { QueryWithoutData } from "~/components/query-without-data";
import { FeedScreen } from "~/components/screens/feed-screen";
import {
  LargeRow,
  NoFeeds,
  SectionHeader,
} from "~/components/screens/feeds-screen-elements";
import { Text } from "~/components/themed/text";
import { useSavedFeeds } from "~/lib/hooks";
import { useReorderFeeds, useToggleFeedPref } from "~/lib/hooks/feeds";
import { useHaptics } from "~/lib/hooks/preferences";
import {
  useDefaultFeed,
  useHomepage,
  useListsAboveFeeds,
  useSortableFeeds,
} from "~/lib/storage/app-preferences";
import { cx } from "~/lib/utils/cx";

interface Props {
  editing: boolean;
}

const FeedsPageUnmemoized = ({ editing }: Props) => {
  const theme = useTheme();

  const savedFeeds = useSavedFeeds();
  const sortableFeeds = useSortableFeeds();
  const listsAboveFeeds = useListsAboveFeeds();

  const toggleFeed = useToggleFeedPref(savedFeeds.data?.preferences);
  const { pinned, saved, reorderFavs, reorderRest } =
    useReorderFeeds(savedFeeds);

  const handleUnsave = (feed: string) => () => {
    toggleFeed.mutate({ save: feed });
  };

  if (savedFeeds.data) {
    if (
      savedFeeds.data.feeds.length === 0 &&
      savedFeeds.data.lists.length === 0
    ) {
      return <NoFeeds />;
    }

    const lists = savedFeeds.data.lists.filter((x) => x && !x.pinned).length >
      0 && (
      <>
        <SectionHeader title="マイリスト" />
        <NestableDraggableFlatList
          data={
            sortableFeeds
              ? saved
                  .map(
                    (uri) => savedFeeds.data.lists.find((f) => f.uri === uri)!,
                  )
                  .filter((x) => x && !x.pinned)
              : savedFeeds.data.lists
                  .filter((feed) => !feed.pinned)
                  .sort((a, b) => a.name.localeCompare(b.name))
          }
          keyExtractor={(item) => item.uri}
          style={{ backgroundColor: theme.dark ? "black" : "white" }}
          onDragEnd={({ data }) => {
            reorderRest.mutate(data.map((item) => item.uri));
          }}
          renderItem={({ item, drag }) => (
            <DraggableFeedRow
              feed={item}
              drag={sortableFeeds ? drag : undefined}
              onPressStar={() => {
                toggleFeed.mutate({ pin: item.uri });
              }}
              editing={editing}
              onUnsave={handleUnsave(item.uri)}
            />
          )}
          ItemSeparatorComponent={() => (
            <ItemSeparator iconWidth="w-6" containerClassName="pr-4" />
          )}
        />
      </>
    );

    return (
      <NestableScrollContainer contentInsetAdjustmentBehavior="automatic">
        <LargeRow
          icon={<CloudIcon size={32} color="white" />}
          title="フォロー中"
          subtitle="フォローしている人からの投稿"
          right={
            <ChevronRightIcon
              size={20}
              className={theme.dark ? "text-neutral-200" : "text-neutral-400"}
            />
          }
        />
        {pinned.length > 0 && (
          <>
            <SectionHeader title="お気に入り" />
            <NestableDraggableFlatList
              data={pinned
                .map((uri) => {
                  if (uri.includes("app.bsky.feed.generator")) {
                    return savedFeeds.data.feeds.find((f) => f.uri === uri)!;
                  } else if (uri.includes("app.bsky.graph.list")) {
                    return savedFeeds.data.lists.find((f) => f.uri === uri)!;
                  } else {
                    return null as never;
                  }
                })
                .filter(Boolean)}
              keyExtractor={(item) => item.uri}
              onDragEnd={({ data }) => {
                reorderFavs.mutate(data.map((item) => item.uri));
              }}
              style={{ backgroundColor: theme.dark ? "black" : "white" }}
              renderItem={({ item, drag }) => (
                <DraggableFeedRow
                  feed={item}
                  onPressStar={() => {
                    toggleFeed.mutate({ pin: item.uri });
                  }}
                  drag={drag}
                  editing={editing}
                  onUnsave={handleUnsave(item.uri)}
                />
              )}
              ItemSeparatorComponent={() => (
                <ItemSeparator iconWidth="w-6" containerClassName="pr-4" />
              )}
            />
          </>
        )}
        {listsAboveFeeds && lists}
        <SectionHeader title="すべてのフィード" />
        <NestableDraggableFlatList
          data={
            sortableFeeds
              ? saved
                  .map(
                    (uri) => savedFeeds.data.feeds.find((f) => f.uri === uri)!,
                  )
                  .filter((x) => x && !x.pinned)
              : savedFeeds.data.feeds
                  .filter((feed) => !feed.pinned)
                  .sort((a, b) => a.displayName.localeCompare(b.displayName))
          }
          keyExtractor={(item) => item.uri}
          style={{ backgroundColor: theme.dark ? "black" : "white" }}
          onDragEnd={({ data }) => {
            reorderRest.mutate(data.map((item) => item.uri));
          }}
          renderItem={({ item, drag }) => (
            <DraggableFeedRow
              feed={item}
              drag={sortableFeeds ? drag : undefined}
              onPressStar={() => {
                toggleFeed.mutate({ pin: item.uri });
              }}
              editing={editing}
              onUnsave={handleUnsave(item.uri)}
            />
          )}
          ItemSeparatorComponent={() => (
            <ItemSeparator iconWidth="w-6" containerClassName="pr-4" />
          )}
        />
        {!listsAboveFeeds && lists}
        <View className="p-6">
          <Link href="/discover" asChild>
            <TouchableHighlight className="overflow-hidden rounded-lg">
              <View
                className="flex-row items-center justify-between p-4"
                style={{ backgroundColor: theme.colors.card }}
              >
                <View className="flex-row items-center">
                  <CompassIcon size={20} className="text-blue-500" />
                  <Text className="ml-3 text-base">Discover more feeds</Text>
                </View>
                <ChevronRightIcon size={20} className="text-neutral-400" />
              </View>
            </TouchableHighlight>
          </Link>
        </View>
      </NestableScrollContainer>
    );
  }

  return <QueryWithoutData query={savedFeeds} />;
};

export const FeedsPage = memo(FeedsPageUnmemoized);

export default function Page() {
  const [editing, setEditing] = useState(false);
  const theme = useTheme();
  const haptics = useHaptics();
  const homepage = useHomepage();
  const defaultFeed = useDefaultFeed();

  const headerLeft = useCallback(() => <OpenDrawerAvatar />, []);

  if (homepage === "skyline") {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Skyline",
            headerLargeTitle: false,
            headerLeft,
            headerRight: () => null,
          }}
        />
        <FeedScreen feed={defaultFeed} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "フィード",
          headerLargeTitle: true,
          headerLeft,
          headerRight: () => (
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  setEditing((e) => !e);
                }}
              >
                <Text
                  primary
                  className={cx("text-lg", editing && "font-medium")}
                >
                  {editing ? "完了" : "編集"}
                </Text>
              </TouchableOpacity>
              {!editing && (
                <Link href="/discover" asChild>
                  <TouchableOpacity className="ml-4">
                    <PlusIcon size={24} color={theme.colors.primary} />
                  </TouchableOpacity>
                </Link>
              )}
            </View>
          ),
        }}
      />
      <FeedsPage editing={editing} />
    </>
  );
}
