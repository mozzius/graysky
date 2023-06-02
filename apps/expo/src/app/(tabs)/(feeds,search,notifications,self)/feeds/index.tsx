import { useState } from "react";
import { Text, TouchableHighlight, TouchableOpacity, View } from "react-native";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
} from "react-native-draggable-flatlist";
import { Image } from "expo-image";
import { Link, Stack } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { ChevronRight, Cloud, Star } from "lucide-react-native";

import { Avatar } from "../../../../components/avatar";
import { ComposeButton } from "../../../../components/compose-button";
import { useDrawer } from "../../../../components/drawer-content";
import { QueryWithoutData } from "../../../../components/query-without-data";
import { useSavedFeeds } from "../../../../lib/hooks";
import { cx } from "../../../../lib/utils/cx";

const FeedsPage = () => {
  const savedFeeds = useSavedFeeds();

  if (savedFeeds.data) {
    return (
      <NestableScrollContainer contentInsetAdjustmentBehavior="automatic">
        <Link href="/feeds/following" asChild>
          <TouchableHighlight>
            <View className="flex-row items-center bg-white p-4 dark:bg-black">
              <View className="h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-500">
                <Cloud size={32} color="white" />
              </View>
              <View className="flex-1 px-3">
                <Text className="text-lg leading-5 dark:text-white">
                  Following
                </Text>
                <Text className="text-sm text-neutral-500">
                  Posts from people you follow
                </Text>
              </View>
              <ChevronRight size={20} className="text-neutral-400" />
            </View>
          </TouchableHighlight>
        </Link>
        <SectionHeader title="Favourites" />
        <NestableDraggableFlatList
          data={savedFeeds.data.feeds.filter((feed) => feed.pinned)}
          keyExtractor={(item) => item.uri}
          renderItem={({ item }) => <DraggableFeedRow feed={item} />}
          ItemSeparatorComponent={() => <ItemSeparator iconWidth="w-6" />}
        />
        <SectionHeader title="All feeds" />
        <NestableDraggableFlatList
          data={savedFeeds.data.feeds.filter((feed) => !feed.pinned)}
          keyExtractor={(item) => item.uri}
          renderItem={({ item }) => <DraggableFeedRow feed={item} />}
          ItemSeparatorComponent={() => <ItemSeparator iconWidth="w-6" />}
        />
      </NestableScrollContainer>
    );
  }

  return <QueryWithoutData query={savedFeeds} />;
};

export default function Page() {
  const openDrawer = useDrawer();
  const [editing, setEditing] = useState(false);
  return (
    <>
      <Stack.Screen
        options={{
          title: "Feeds",
          headerLargeTitle: true,
          headerLeft: () => (
            <TouchableOpacity onPress={openDrawer}>
              <Avatar size="small" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => setEditing((e) => !e)}>
              <Text className="dark:text-white text-base font-medium">
                {editing ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <FeedsPage />
      <ComposeButton />
    </>
  );
}

const SectionHeader = ({ title }: { title: string }) => (
  <View className="px-4 py-1 w-full dark:bg-neutral-900">
    <Text className="font-medium text-neutral-600 dark:text-neutral-400">
      {title.toLocaleUpperCase()}
    </Text>
  </View>
);

const ItemSeparator = ({ iconWidth }: { iconWidth?: string }) => (
  <View className="flex-row bg-white px-4 dark:bg-black">
    {iconWidth && <View className={cx(iconWidth, "mr-3 shrink-0")} />}
    <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
  </View>
);

const DraggableFeedRow = ({
  feed,
}: {
  feed: AppBskyFeedDefs.GeneratorView & { pinned: boolean };
}) => {
  const href = `/profile/${feed.creator.did}/generator/${feed.uri
    .split("/")
    .pop()}`;
  return (
    <Link href={href} asChild>
      <TouchableHighlight>
        <View className="flex-row items-center bg-white px-4 py-3 dark:bg-black">
          <Image
            source={{ uri: feed.avatar }}
            alt={feed.displayName}
            className="h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500"
          />
          <View className="flex-1 px-3">
            <Text className="text-base dark:text-white">
              {feed.displayName}
            </Text>
          </View>
          <TouchableOpacity onPress={() => {}}>
            <Star
              size={24}
              className={feed.pinned ? "text-blue-500" : "text-neutral-200"}
              fill="currentColor"
            />
          </TouchableOpacity>
        </View>
      </TouchableHighlight>
    </Link>
  );
};
