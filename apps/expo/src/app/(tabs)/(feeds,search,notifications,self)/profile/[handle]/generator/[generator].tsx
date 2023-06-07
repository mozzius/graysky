import { Fragment, useCallback, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { Drawer } from "react-native-drawer-layout";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { type AppBskyFeedGetFeedGenerator } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Heart, Plus, Star, X } from "lucide-react-native";

import { FeedRow } from "../../../../../../components/feed-row";
import { ItemSeparator } from "../../../../../../components/item-separator";
import { QueryWithoutData } from "../../../../../../components/query-without-data";
import { RichTextWithoutFacets } from "../../../../../../components/rich-text";
import { FeedScreen } from "../../../../../../components/screens/feed-screen";
import { useAuthedAgent } from "../../../../../../lib/agent";
import {
  useFeedInfo,
  useSavedFeeds,
  useToggleFeedPref,
} from "../../../../../../lib/hooks/feeds";
import { cx } from "../../../../../../lib/utils/cx";

export default function FeedPage() {
  const [open, setOpen] = useState(false);
  const { handle, generator } = useLocalSearchParams() as {
    handle: string;
    generator: string;
  };
  const theme = useTheme();

  const feed = `at://${handle}/app.bsky.feed.generator/${generator}`;

  const info = useFeedInfo(feed);
  const renderDrawerContent = useCallback(() => {
    if (info.data) {
      return <FeedInfo feed={feed} info={info.data} />;
    } else {
      return <QueryWithoutData query={info} />;
    }
  }, [feed, info]);

  return (
    <Drawer
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      renderDrawerContent={renderDrawerContent}
      drawerType="front"
      statusBarAnimation="slide"
      drawerPosition="right"
      drawerStyle={{
        width: Dimensions.get("window").width * 0.9,
        backgroundColor: theme.colors.background,
      }}
      swipeEdgeWidth={Dimensions.get("window").width * 0.1}
    >
      <FeedScreen feed={feed} />
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => setOpen((o) => !o)}>
              {open ? (
                <View className="">
                  <X color={theme.colors.primary} />
                </View>
              ) : (
                <Image
                  source={{ uri: info.data?.view.avatar }}
                  className="h-6 w-6 rounded bg-blue-500"
                  alt={info.data?.view.displayName}
                />
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        options={{
          headerTitleStyle: {
            color: open ? theme.colors.card : theme.colors.text,
          },
        }}
      />
    </Drawer>
  );
}

const FeedInfo = ({
  feed,
  info,
}: {
  feed: string;
  info: AppBskyFeedGetFeedGenerator.OutputSchema;
}) => {
  const agent = useAuthedAgent();
  const savedFeeds = useSavedFeeds();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const toggleSave = useToggleFeedPref(savedFeeds.data?.preferences);
  const toggleLike = useMutation({
    onMutate: () => void Haptics.impactAsync(),
    mutationFn: async () => {
      if (info.view.viewer?.like) {
        await agent.deleteLike(info.view.viewer.like);
      } else {
        await agent.like(info.view.uri, info.view.cid);
      }
    },
    onSettled: () => queryClient.invalidateQueries(["generator", feed]),
  });

  const creator = useQuery({
    queryKey: ["profile", info.view.creator.handle, "with-some-feeds"],
    queryFn: async () => {
      const profile = await agent.getProfile({
        actor: info.view.creator.handle,
      });
      if (!profile.success) throw new Error("Profile not found");
      const feeds = await agent.app.bsky.feed.getActorFeeds({
        actor: info.view.creator.handle,
        limit: 6,
      });
      if (!feeds.success) throw new Error("Could not get feeds");
      return {
        profile: profile.data,
        feeds: feeds.data.feeds,
      };
    },
  });

  if (savedFeeds.data) {
    const isSaved = savedFeeds.data.saved.includes(feed);
    const isPinned = savedFeeds.data.pinned.includes(feed);

    return (
      <ScrollView className="flex-1">
        <View className="w-full border-b border-neutral-300 bg-white p-4 dark:border-b-0 dark:bg-black">
          <View className="w-full flex-row items-center">
            <Image
              source={{ uri: info.view.avatar }}
              className="h-12 w-12 rounded bg-blue-500"
              alt={info.view.displayName}
            />
            <View className="px-4">
              <Text
                style={{ color: theme.colors.text }}
                className="text-xl font-medium"
              >
                {info.view.displayName}
              </Text>
              <Link asChild href={`/profile/${info.view.creator.handle}`}>
                <TouchableOpacity>
                  <Text className="text-base text-neutral-400">
                    By @{info.view.creator.handle}
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
          {info.view.description && (
            <Text
              style={{ color: theme.colors.text }}
              className="mt-4 text-base"
            >
              <RichTextWithoutFacets text={info.view.description} />
            </Text>
          )}
          <View
            className={cx(
              "mt-4 flex-row items-center",
              typeof isSaved === "undefined" && "opacity-0",
            )}
          >
            <TouchableHighlight
              className={cx(
                "flex-1 rounded",
                toggleSave.isLoading && "opacity-50",
              )}
              onPress={() => toggleSave.mutate({ save: info.view.uri })}
              disabled={toggleSave.isLoading}
            >
              <View className="flex-1 flex-row items-center justify-center rounded border border-neutral-300 bg-white py-2 dark:border-neutral-700 dark:bg-black">
                {isSaved ? (
                  <>
                    <Check
                      style={{ color: theme.colors.text }}
                      className="h-6 w-6"
                      size={16}
                    />
                    <Text
                      style={{ color: theme.colors.text }}
                      className="ml-2 text-base"
                    >
                      Saved
                    </Text>
                  </>
                ) : (
                  <>
                    <Plus
                      style={{ color: theme.colors.text }}
                      className="h-6 w-6"
                      size={16}
                    />
                    <Text
                      style={{ color: theme.colors.text }}
                      className="ml-2 text-base"
                    >
                      Save
                    </Text>
                  </>
                )}
              </View>
            </TouchableHighlight>
            {isSaved && (
              <TouchableHighlight
                onPress={() => toggleSave.mutate({ pin: info.view.uri })}
                className={cx(
                  "ml-2 rounded",
                  toggleSave.isLoading && "opacity-50",
                )}
                disabled={toggleSave.isLoading}
              >
                <View className="items-center justify-center rounded border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-black">
                  <Star
                    className={cx(
                      "h-8 w-8",
                      isPinned
                        ? "text-yellow-400 dark:text-yellow-500"
                        : "text-neutral-400",
                    )}
                    fill="currentColor"
                  />
                </View>
              </TouchableHighlight>
            )}
            <TouchableHighlight
              onPress={() => toggleLike.mutate()}
              className={cx(
                "ml-2 rounded",
                toggleLike.isLoading && "opacity-50",
              )}
            >
              <View
                className={cx(
                  "flex-row items-center rounded border px-3 py-2",
                  info.view.viewer?.like
                    ? "border-red-200 bg-red-100 dark:border-red-800 dark:bg-red-950"
                    : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-black",
                )}
              >
                <Heart
                  className="h-8 w-8"
                  color={"#dc2626"}
                  fill={info.view.viewer?.like ? "#dc2626" : "transparent"}
                />
                <Text
                  style={{ color: theme.colors.text }}
                  className="ml-2 text-base tabular-nums"
                >
                  {info.view.likeCount}
                </Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
        {creator.data ? (
          <View className="my-4 w-full">
            <Text className="mb-1 ml-8 mr-4 text-sm uppercase text-neutral-500">
              Creator
            </Text>
            <Link href={`/profile/${info.view.creator.handle}`} asChild>
              <TouchableHighlight className="mx-4 overflow-hidden rounded-lg">
                <View
                  style={{ backgroundColor: theme.colors.card }}
                  className="flex-row items-center px-4 py-2"
                >
                  <Image
                    source={{ uri: info.view.creator.avatar }}
                    className="h-12 w-12 rounded-full bg-neutral-300"
                    alt={info.view.creator.displayName}
                  />
                  <View className="flex-1 justify-center px-3">
                    <Text
                      style={{ color: theme.colors.text }}
                      className="text-base"
                      numberOfLines={2}
                    >
                      {info.view.creator.displayName}
                    </Text>
                    <Text
                      className="text-sm text-neutral-500 dark:text-neutral-400"
                      numberOfLines={1}
                    >
                      @{info.view.creator.handle}
                    </Text>
                  </View>
                  <ChevronRight
                    size={20}
                    className="text-neutral-400 dark:text-neutral-200"
                  />
                </View>
              </TouchableHighlight>
            </Link>
            {creator.data.feeds.length > 1 && (
              <>
                <Text
                  className="mb-1 ml-8 mr-4 mt-6 text-sm uppercase text-neutral-500"
                  numberOfLines={1}
                >
                  More from {info.view.creator.displayName}
                </Text>
                <View
                  style={{ backgroundColor: theme.colors.card }}
                  className="mx-4 overflow-hidden rounded-lg"
                >
                  {creator.data.feeds
                    .filter((f) => f.uri !== info.view.uri)
                    .slice(0, 5)
                    .map((feed) => (
                      <Fragment key={feed.uri}>
                        <FeedRow feed={feed}>
                          {savedFeeds.data?.saved.some(
                            (f) => f === feed.uri,
                          ) && (
                            <Check
                              className="ml-2"
                              size={20}
                              color={theme.colors.primary}
                            />
                          )}
                        </FeedRow>
                        <ItemSeparator iconWidth="w-6" />
                      </Fragment>
                    ))}
                  <Link
                    href={`/profile/${info.view.creator.handle}?tab=feeds`}
                    asChild
                  >
                    <TouchableHighlight>
                      <View
                        style={{ backgroundColor: theme.colors.card }}
                        className="flex-row items-center px-4 py-3"
                      >
                        <View className="ml-6 flex-1 flex-row items-center px-3">
                          <Text
                            style={{ color: theme.colors.text }}
                            className="text-base"
                          >
                            View all feeds
                          </Text>
                        </View>
                        <ChevronRight
                          size={20}
                          className="text-neutral-400 dark:text-neutral-200"
                        />
                      </View>
                    </TouchableHighlight>
                  </Link>
                </View>
              </>
            )}
          </View>
        ) : (
          <QueryWithoutData query={creator} />
        )}
      </ScrollView>
    );
  }

  return <QueryWithoutData query={savedFeeds} />;
};
