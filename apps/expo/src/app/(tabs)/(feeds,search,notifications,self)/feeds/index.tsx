import { useState } from "react";
import { Text, TouchableHighlight, TouchableOpacity, View } from "react-native";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
} from "react-native-draggable-flatlist";
import { Link, Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { ChevronRight, Cloud, Compass } from "lucide-react-native";

import { ComposeButton } from "../../../../components/compose-button";
import { DraggableFeedRow } from "../../../../components/feed-row";
import { ItemSeparator } from "../../../../components/item-separator";
import { QueryWithoutData } from "../../../../components/query-without-data";
import { useSavedFeeds } from "../../../../lib/hooks";
import {
  useReorderFeeds,
  useToggleFeedPref,
} from "../../../../lib/hooks/feeds";
import { cx } from "../../../../lib/utils/cx";

interface Props {
  editing: boolean;
}
const FeedsPage = ({ editing }: Props) => {
  const savedFeeds = useSavedFeeds();

  const toggleFeed = useToggleFeedPref(savedFeeds.data?.preferences);
  const { pinned, reorder } = useReorderFeeds(savedFeeds);

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
          data={pinned
            .map((uri) => savedFeeds.data.feeds.find((f) => f.uri === uri)!)
            .filter(Boolean)}
          keyExtractor={(item) => item.uri}
          onDragEnd={({ data }) => {
            reorder.mutate(data.map((item) => item.uri));
          }}
          renderItem={({ item, drag }) => (
            <DraggableFeedRow
              feed={item}
              onPressStar={() => {
                toggleFeed.mutate({ pin: item.uri });
              }}
              drag={editing ? drag : undefined}
            />
          )}
          ItemSeparatorComponent={() => (
            <ItemSeparator iconWidth="w-6" containerClassName="pr-4" />
          )}
        />
        <SectionHeader title="All feeds" />
        <NestableDraggableFlatList
          data={savedFeeds.data.feeds
            .filter((feed) => !feed.pinned)
            .sort((a, b) => a.displayName.localeCompare(b.displayName))}
          keyExtractor={(item) => item.uri}
          renderItem={({ item }) => (
            <DraggableFeedRow
              feed={item}
              onPressStar={() => {
                toggleFeed.mutate({ pin: item.uri });
              }}
            />
          )}
          ItemSeparatorComponent={() => (
            <ItemSeparator iconWidth="w-6" containerClassName="pr-4" />
          )}
        />
        <View className="mb-20 p-6">
          <Link href="/feeds/discover" asChild>
            <TouchableHighlight className="overflow-hidden rounded-lg">
              <View className="flex-row items-center justify-between bg-white p-4 dark:bg-neutral-900">
                <View className="flex-row items-center">
                  <Compass size={20} className="text-blue-500" />
                  <Text className="ml-3 text-base dark:text-white">
                    Discover more feeds
                  </Text>
                </View>
                <ChevronRight size={20} className="text-neutral-400" />
              </View>
            </TouchableHighlight>
          </Link>
        </View>
      </NestableScrollContainer>
    );
  }

  return <QueryWithoutData query={savedFeeds} />;
};

export default function Page() {
  // const openDrawer = useDrawer();
  const [editing, setEditing] = useState(false);
  const theme = useTheme();
  return (
    <>
      <Stack.Screen
        options={{
          title: "Feeds",
          headerLargeTitle: true,
          headerBackTitle: "Feeds",
          // headerLeft: () => (
          //   <TouchableOpacity onPress={openDrawer} className="mr-3">
          //     <Avatar size="small" />
          //   </TouchableOpacity>
          // ),
          headerRight: () => (
            <TouchableOpacity onPress={() => setEditing((e) => !e)}>
              <Text
                style={{ color: theme.colors.primary }}
                className={cx("text-lg", editing && "font-medium")}
              >
                {editing ? "Done" : "Edit"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <FeedsPage editing={editing} />
      <ComposeButton />
    </>
  );
}

const SectionHeader = ({ title }: { title: string }) => (
  <View className="w-full px-4 py-1 dark:bg-neutral-900">
    <Text className="font-medium text-neutral-600 dark:text-neutral-400">
      {title.toLocaleUpperCase()}
    </Text>
  </View>
);
