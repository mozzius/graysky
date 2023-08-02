import { useState } from "react";
import { Text, TouchableHighlight, TouchableOpacity, View } from "react-native";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
} from "react-native-draggable-flatlist";
import { Link, Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { ChevronRight, Cloud, Compass, Plus } from "lucide-react-native";

import { Avatar } from "../../../../components/avatar";
import { useDrawer } from "../../../../components/drawer-content";
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
  const theme = useTheme();

  const savedFeeds = useSavedFeeds();

  const toggleFeed = useToggleFeedPref(savedFeeds.data?.preferences);
  const { pinned, reorder } = useReorderFeeds(savedFeeds);

  const handleUnsave = (feed: string) => () => {
    toggleFeed.mutate({ save: feed });
  };

  if (savedFeeds.data) {
    return (
      <NestableScrollContainer contentInsetAdjustmentBehavior="automatic">
        <Link href="/feeds/following" asChild>
          <TouchableHighlight>
            <View
              className={cx(
                "flex-row items-center p-4",
                theme.dark ? "bg-black" : "bg-white",
              )}
            >
              <View className="h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-500">
                <Cloud size={32} color="white" />
              </View>
              <View className="flex-1 px-3">
                <Text
                  style={{ color: theme.colors.text }}
                  className="text-lg leading-5"
                >
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
        <SectionHeader title="All feeds" />
        <NestableDraggableFlatList
          data={savedFeeds.data.feeds
            .filter((feed) => !feed.pinned)
            .sort((a, b) => a.displayName.localeCompare(b.displayName))}
          keyExtractor={(item) => item.uri}
          style={{ backgroundColor: theme.dark ? "black" : "white" }}
          renderItem={({ item }) => (
            <DraggableFeedRow
              feed={item}
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
        <View className="mb-20 p-6">
          <Link href="/feeds/discover" asChild>
            <TouchableHighlight className="overflow-hidden rounded-lg">
              <View
                className="flex-row items-center justify-between p-4"
                style={{ backgroundColor: theme.colors.card }}
              >
                <View className="flex-row items-center">
                  <Compass size={20} className="text-blue-500" />
                  <Text
                    style={{ color: theme.colors.text }}
                    className="ml-3 text-base"
                  >
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
  const openDrawer = useDrawer();
  const [editing, setEditing] = useState(false);
  const theme = useTheme();
  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={() => openDrawer()} className="mr-3">
              <Avatar size="small" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => setEditing((e) => !e)}>
                <Text
                  style={{ color: theme.colors.primary }}
                  className={cx("text-lg", editing && "font-medium")}
                >
                  {editing ? "Done" : "Edit"}
                </Text>
              </TouchableOpacity>
              {!editing && (
                <Link href="/feeds/discover" asChild>
                  <TouchableOpacity className="ml-4">
                    <Plus size={24} color={theme.colors.primary} />
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

const SectionHeader = ({ title }: { title: string }) => {
  const theme = useTheme();
  return (
    <View
      className="w-full px-4 py-1"
      style={{
        backgroundColor: theme.dark
          ? theme.colors.card
          : theme.colors.background,
      }}
    >
      <Text
        className={cx(
          "font-medium",
          theme.dark ? "text-neutral-400" : "text-neutral-600",
        )}
      >
        {title.toLocaleUpperCase()}
      </Text>
    </View>
  );
};
