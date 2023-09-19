import { useState } from "react";
import {
  TouchableHighlight,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
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

import { Avatar } from "~/components/avatar";
import { useDrawer } from "~/components/drawer-content";
import { DraggableFeedRow } from "~/components/feed-row";
import { ItemSeparator } from "~/components/item-separator";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/text";
import { useSavedFeeds } from "~/lib/hooks";
import { useReorderFeeds, useToggleFeedPref } from "~/lib/hooks/feeds";
import { useAppPreferences, useHaptics } from "~/lib/hooks/preferences";
import { cx } from "~/lib/utils/cx";

export const NoFeeds = () => {
  const theme = useTheme();
  return (
    <View className="flex-1 items-center justify-center">
      <Stack.Screen options={{ headerRight: () => null }} />
      <View className="w-3/4 flex-col items-start">
        <Text className="mb-4 text-4xl font-medium">Welcome to Bluesky!</Text>
        <Text className="text-lg">
          To get started, add some feeds to your home screen.
        </Text>
        <Link asChild href="/feeds/discover">
          <TouchableOpacity
            className="mt-8 flex-row items-center rounded-full py-2 pl-4 pr-8"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <CompassIcon size={20} className="text-white" />
            <Text className="ml-4 text-xl text-white">Discover feeds</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

interface Props {
  editing: boolean;
}
const FeedsPage = ({ editing }: Props) => {
  const theme = useTheme();

  const savedFeeds = useSavedFeeds();
  const [{ sortableFeeds }] = useAppPreferences();

  const toggleFeed = useToggleFeedPref(savedFeeds.data?.preferences);
  const { pinned, saved, reorderFavs, reorderRest } =
    useReorderFeeds(savedFeeds);

  const handleUnsave = (feed: string) => () => {
    toggleFeed.mutate({ save: feed });
  };

  if (savedFeeds.data) {
    if (savedFeeds.data.feeds.length === 0) {
      return <NoFeeds />;
    }

    return (
      <NestableScrollContainer contentInsetAdjustmentBehavior="automatic">
        <Link href="/feeds/following" asChild>
          <TouchableHighlight>
            <LargeRow
              icon={<CloudIcon size={32} color="white" />}
              title="Following"
              subtitle="Posts from people you follow"
            />
          </TouchableHighlight>
        </Link>
        {pinned.length > 0 && (
          <>
            <SectionHeader title="Favourites" />
            <NestableDraggableFlatList
              data={pinned
                .map((uri) => savedFeeds.data.feeds.find((f) => f.uri === uri)!)
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
        <SectionHeader title="All feeds" />
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
        <View className="p-6">
          <Link href="/feeds/discover" asChild>
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

export default function Page() {
  const openDrawer = useDrawer();
  const [editing, setEditing] = useState(false);
  const theme = useTheme();
  const haptics = useHaptics();

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
              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  setEditing((e) => !e);
                }}
              >
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

interface LargeRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const LargeRow = ({
  icon,
  title,
  subtitle,
  className,
  style,
}: LargeRowProps) => {
  const theme = useTheme();
  return (
    <View
      className={cx(
        "flex-row items-center p-4",
        theme.dark ? "bg-black" : "bg-white",
        className,
      )}
      style={style}
    >
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-500">
        {icon}
      </View>
      <View className="flex-1 px-3">
        <Text className="text-lg leading-5">{title}</Text>
        <Text className="text-sm text-neutral-500">{subtitle}</Text>
      </View>
      <ChevronRightIcon size={20} className="text-neutral-400" />
    </View>
  );
};
