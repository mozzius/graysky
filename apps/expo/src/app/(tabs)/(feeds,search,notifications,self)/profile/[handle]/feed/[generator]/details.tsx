import { Fragment } from "react";
import {
  Platform,
  ScrollView,
  Share as Sharing,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { type AppBskyFeedGetFeedGenerator } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  ChevronRightIcon,
  HeartIcon,
  PlusIcon,
  ShareIcon,
  StarIcon,
} from "lucide-react-native";
import colors from "tailwindcss/colors";

import { Avatar } from "~/components/avatar";
import { FeedRow } from "~/components/feed-row";
import { ItemSeparator } from "~/components/item-separator";
import { QueryWithoutData } from "~/components/query-without-data";
import { RichText, RichTextWithoutFacets } from "~/components/rich-text";
import { Text } from "~/components/themed/text";
import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useAgent } from "~/lib/agent";
import {
  useFeedInfo,
  useSavedFeeds,
  useToggleFeedPref,
} from "~/lib/hooks/feeds";
import { useHaptics } from "~/lib/hooks/preferences";
import { cx } from "~/lib/utils/cx";

export default function FeedDetails() {
  const { handle, generator } = useLocalSearchParams<{
    handle: string;
    generator: string;
  }>();

  const feed = `at://${handle}/app.bsky.feed.generator/${generator}`;

  const info = useFeedInfo(feed);

  if (info.data) {
    return (
      <>
        <Stack.Screen options={{ title: "Feed Details" }} />
        <FeedInfo feed={feed} info={info.data} />
      </>
    );
  } else {
    return (
      <>
        <Stack.Screen options={{ title: "Feed Details" }} />
        <QueryWithoutData query={info} />
      </>
    );
  }
}

const FeedInfo = ({
  feed,
  info,
}: {
  feed: string;
  info: AppBskyFeedGetFeedGenerator.OutputSchema;
}) => {
  const agent = useAgent();
  const savedFeeds = useSavedFeeds();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const { handle, generator } = useLocalSearchParams<{
    handle: string;
    generator: string;
  }>();
  const haptics = useHaptics();
  const path = useAbsolutePath();

  const toggleSave = useToggleFeedPref(savedFeeds.data?.preferences);
  const toggleLike = useMutation({
    onMutate: () => haptics.impact(),
    mutationFn: async () => {
      if (info.view.viewer?.like) {
        await agent.deleteLike(info.view.viewer.like);
      } else {
        await agent.like(info.view.uri, info.view.cid);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["generator", feed] }),
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
        <View
          className={cx(
            "w-full border-neutral-300 p-4",
            theme.dark ? "bg-black" : "border-b bg-white",
          )}
        >
          <View className="w-full flex-row items-center">
            <Image
              source={{ uri: info.view.avatar }}
              className="h-12 w-12 rounded-md bg-blue-500"
              alt={info.view.displayName}
            />
            <View className="px-4">
              <Text className="text-xl font-medium">
                {info.view.displayName}
              </Text>
              <Link asChild href={path(`/profile/${info.view.creator.handle}`)}>
                <TouchableOpacity>
                  <Text className="text-base text-neutral-500">
                    By @{info.view.creator.handle}
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
          {info.view.description && (
            <Text className="mt-4 w-full text-base">
              {info.view.descriptionFacets ? (
                <RichText
                  text={info.view.description}
                  facets={info.view.descriptionFacets}
                />
              ) : (
                <RichTextWithoutFacets text={info.view.description} />
              )}
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
                toggleSave.isPending && "opacity-50",
              )}
              onPress={() => toggleSave.mutate({ save: info.view.uri })}
              disabled={toggleSave.isPending}
            >
              <View
                className={cx(
                  "flex-1 flex-row items-center justify-center rounded border py-1.5",
                  theme.dark
                    ? "border-neutral-700 bg-black"
                    : "border-neutral-300 bg-white",
                )}
              >
                {isSaved ? (
                  <>
                    <CheckIcon
                      className="h-6 w-6"
                      size={18}
                      color={theme.colors.text}
                    />
                    <Text className="ml-2 text-base">Saved</Text>
                  </>
                ) : (
                  <>
                    <PlusIcon
                      className="h-6 w-6"
                      size={18}
                      color={theme.colors.primary}
                    />
                    <Text className="ml-2 text-base">Save</Text>
                  </>
                )}
              </View>
            </TouchableHighlight>
            {isSaved && (
              <TouchableHighlight
                onPress={() => toggleSave.mutate({ pin: info.view.uri })}
                className={cx(
                  "ml-2 rounded",
                  toggleSave.isPending && "opacity-50",
                )}
                disabled={toggleSave.isPending}
              >
                <View
                  className={cx(
                    "items-center justify-center rounded border px-2 py-1.5",
                    theme.dark
                      ? "border-neutral-700 bg-black"
                      : "border-neutral-300 bg-white",
                  )}
                  style={{ backgroundColor: theme.dark ? "black" : "white" }}
                >
                  <StarIcon
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
                toggleLike.isPending && "opacity-50",
              )}
            >
              <View
                className={cx(
                  "flex-row items-center rounded border px-2 py-1.5",
                  theme.dark
                    ? "border-neutral-700 bg-black"
                    : "border-neutral-300 bg-white",
                )}
              >
                <HeartIcon
                  size={18}
                  color={colors.red[600]}
                  fill={
                    info.view.viewer?.like ? colors.red[600] : "transparent"
                  }
                />
                <Text
                  className={cx(
                    "ml-2 text-base",
                    info.view.viewer?.like && "font-bold",
                  )}
                  style={{
                    fontVariant: ["tabular-nums"],
                    color: info.view.viewer?.like
                      ? colors.red[600]
                      : theme.colors.text,
                  }}
                >
                  {info.view.likeCount}
                </Text>
              </View>
            </TouchableHighlight>
          </View>
        </View>
        {creator.data ? (
          <View className="my-4 w-full">
            <Text className="mx-8 mb-1.5 text-xs uppercase text-neutral-500">
              Creator
            </Text>
            <Link href={path(`/profile/${info.view.creator.handle}`)} asChild>
              <TouchableHighlight className="mx-4 overflow-hidden rounded-lg">
                <View
                  style={{ backgroundColor: theme.colors.card }}
                  className="flex-row items-center px-2 py-1.5"
                >
                  <Avatar
                    uri={info.view.creator.avatar}
                    alt={info.view.creator.displayName}
                    size="large"
                  />
                  <View className="flex-1 justify-center px-3">
                    <Text className="text-base" numberOfLines={2}>
                      {info.view.creator.displayName}
                    </Text>
                    <Text
                      className="text-sm text-neutral-500 dark:text-neutral-400"
                      numberOfLines={1}
                    >
                      @{info.view.creator.handle}
                    </Text>
                  </View>
                  <ChevronRightIcon
                    size={20}
                    className="text-neutral-400 dark:text-neutral-200"
                  />
                </View>
              </TouchableHighlight>
            </Link>
            {creator.data.feeds.length > 1 && (
              <>
                <Text
                  className="mx-8 mb-1.5 mt-4 text-xs uppercase text-neutral-500"
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
                            <CheckIcon
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
                    href={path(
                      `/profile/${info.view.creator.handle}?tab=feeds`,
                    )}
                    asChild
                  >
                    <TouchableHighlight>
                      <View
                        style={{ backgroundColor: theme.colors.card }}
                        className="flex-row items-center px-4 py-3"
                      >
                        <View className="ml-6 flex-1 flex-row items-center px-3">
                          <Text className="text-base">View all feeds</Text>
                        </View>
                        <ChevronRightIcon
                          size={20}
                          className="text-neutral-400 dark:text-neutral-200"
                        />
                      </View>
                    </TouchableHighlight>
                  </Link>
                </View>
              </>
            )}
            <Text
              className="mx-8 mb-1.5 mt-4 text-xs uppercase text-neutral-500"
              numberOfLines={1}
            >
              Share
            </Text>
            <View
              style={{ backgroundColor: theme.colors.card }}
              className="mx-4 mb-4 overflow-hidden rounded-lg"
            >
              <TouchableHighlight
                onPress={() => {
                  const url = `https://bsky.app/profile/${handle}/feed/${generator}`;
                  void Sharing.share(
                    Platform.select({
                      ios: { url },
                      default: { message: url },
                    }),
                  );
                }}
              >
                <View
                  style={{ backgroundColor: theme.colors.card }}
                  className="flex-row items-center px-4 py-3"
                >
                  <ShareIcon
                    color={theme.colors.text}
                    size={18}
                    className="mx-1"
                  />
                  <View className="mx-3 flex-1 flex-row items-center">
                    <Text className="text-base">Share this feed</Text>
                  </View>
                </View>
              </TouchableHighlight>
            </View>
          </View>
        ) : (
          <QueryWithoutData query={creator} />
        )}
      </ScrollView>
    );
  }

  return <QueryWithoutData query={savedFeeds} />;
};
