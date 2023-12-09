import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { type SearchBarCommands } from "react-native-screens";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
} from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { ItemSeparator } from "~/components/item-separator";
import { ListFooterComponent } from "~/components/list-footer";
import { PersonRow } from "~/components/lists/person-row";
import { OpenDrawerAvatar } from "~/components/open-drawer-avatar";
import { QueryWithoutData } from "~/components/query-without-data";
import { RichTextWithoutFacets } from "~/components/rich-text";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { useTabPress } from "~/lib/hooks/tab-press-scroll";
import { useAbsolutePath } from "~/lib/hooks/use-absolute-path";
import { useQuickAction } from "~/lib/quick-actions";
import { cx } from "~/lib/utils/cx";
import { useRefreshOnFocus } from "~/lib/utils/query";

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const action = useQuickAction();

  const autoFocus = action?.id === "search";

  const ref = useRef<SearchBarCommands>(null);

  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: "Search users, posts, feeds",
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    onFocus: () => setIsSearching(true),
    onBlur: () => setIsSearching(false),
    hideWhenScrolling: false,
    hideNavigationBar: false,
    autoFocus,
    ref,
  });

  const headerLeft = useCallback(
    () => (Platform.OS === "android" ? null : <OpenDrawerAvatar />),
    [],
  );

  useTabPress(() => {
    if (ref.current) {
      ref.current.focus();
    }
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: "Search",
          headerLargeTitle: true,
          headerLeft,
          headerSearchBarOptions,
        }}
      />
      {isSearching || search ? (
        <SearchResults search={search} />
      ) : (
        <Suggestions />
      )}
    </>
  );
}
interface Props {
  search: string;
}
const SearchResults = ({ search }: Props) => {
  const agent = useAgent();
  const path = useAbsolutePath();

  const MAX_RESULTS = 6;

  const searchResults = useQuery({
    queryKey: ["search", "people", search, MAX_RESULTS],
    queryFn: async () => {
      if (!search) return { actors: [] };
      const { data, success } = await agent.searchActors({
        term: search,
        limit: MAX_RESULTS,
      });
      if (!success) throw new Error("Failed to search");
      return data;
    },
    placeholderData: keepPreviousData,
  });

  const data = useMemo(() => {
    if (!searchResults.data) return [];
    return searchResults.data.actors;
  }, [searchResults.data]);

  if (searchResults.data) {
    return (
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <GroupedList
          contentInsetAdjustmentBehavior="automatic"
          groups={[
            {
              options: [
                {
                  icon: SearchIcon,
                  title: "Search posts",
                  href: path(`/search/posts?q=${encodeURIComponent(search)}`),
                },
                {
                  icon: SearchIcon,
                  title: "Search feeds",
                  href: path(`/search/feeds?q=${encodeURIComponent(search)}`),
                },
                data.length === 0
                  ? {
                      icon: SearchIcon,
                      title: "Search users",
                      href: path(
                        `/search/people?q=${encodeURIComponent(search)}`,
                      ),
                    }
                  : [],
              ].flat(),
            },
            data.length > 0
              ? {
                  children: data.slice(0, 5).map((item, i, arr) => (
                    <Fragment key={item.did}>
                      <PersonRow person={item} />
                      {i !== arr.length - 1 ? (
                        <ItemSeparator iconWidth="w-10" />
                      ) : (
                        data.length === MAX_RESULTS && <ItemSeparator />
                      )}
                    </Fragment>
                  )),
                  options:
                    data.length === MAX_RESULTS
                      ? [
                          {
                            icon: SearchIcon,
                            title: "Search all users",
                            href: path(
                              `/search/people?q=${encodeURIComponent(search)}`,
                            ),
                          },
                        ]
                      : [],
                }
              : [],
          ].flat()}
        />
      </KeyboardAvoidingView>
    );
  }

  return <QueryWithoutData query={searchResults} />;
};

export interface TrendingTopic {
  tag: string;
  name: string;
  count: number;
}

const TIMEFRAME = 360; // 6 hours, in minutes

const Suggestions = () => {
  const agent = useAgent();
  const theme = useTheme();
  const path = useAbsolutePath();
  const [showAll, setShowAll] = useState(false);
  const ref = useRef<FlashList<AppBskyActorDefs.ProfileView>>(null);

  const trendingTopics = useQuery({
    queryKey: ["trending-topics", TIMEFRAME],
    queryFn: async () => {
      const response = await fetch(
        `https://skyfeed-trending-tags.b-cdn.net/xrpc/app.skyfeed.feed.getTrendingTags?minutes=${TIMEFRAME}`,
      );
      const json = (await response.json()) as {
        tags: TrendingTopic[];
      };
      return json.tags;
    },
  });

  const suggestions = useInfiniteQuery({
    queryKey: ["network"],
    queryFn: async ({ pageParam }) => {
      const result = await agent.getSuggestions({
        cursor: pageParam,
      });
      if (!result.success) throw new Error("Failed to get suggestions");
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.data.cursor,
  });

  useRefreshOnFocus(suggestions.refetch);

  if (suggestions.data) {
    return (
      <FlashList<AppBskyActorDefs.ProfileView>
        ref={ref}
        data={suggestions.data.pages.flatMap((page) => page.data.actors)}
        estimatedItemSize={173}
        renderItem={({ item }) => <SuggestionCard item={item} />}
        ListHeaderComponent={
          <View>
            <Text className="mt-4 px-4 text-lg font-bold">Trending topics</Text>
            {!trendingTopics.isPending ? (
              trendingTopics.data ? (
                <View className="flex-col px-4">
                  {trendingTopics.data
                    .slice(0, showAll ? 20 : 3)
                    .map((tag, i) => (
                      <Link
                        key={tag.name}
                        asChild
                        href={path(`/tag/${encodeURIComponent(tag.tag)}`)}
                      >
                        <TouchableHighlight className="mt-2 flex-1 rounded-lg">
                          <Animated.View
                            entering={
                              i >= 3 ? FadeInUp.delay(50 * i) : undefined
                            }
                            exiting={
                              i >= 3
                                ? FadeOutUp.delay(50 * (17 - i))
                                : undefined
                            }
                            className="flex-1 flex-row rounded-lg px-4 py-2"
                            style={{
                              backgroundColor: theme.colors.card,
                              borderWidth: StyleSheet.hairlineWidth,
                              borderColor: theme.colors.border,
                            }}
                          >
                            <Text className="text-base">{i + 1}.</Text>
                            <View className="ml-1 flex-1 flex-col">
                              <Text className="text-base" numberOfLines={1}>
                                <Text className="font-semibold">
                                  {tag.name}
                                </Text>{" "}
                                <Text className="font-normal text-neutral-400 dark:text-neutral-500">
                                  #{tag.tag}
                                </Text>
                              </Text>
                              <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                                {tag.count} posts
                              </Text>
                            </View>
                          </Animated.View>
                        </TouchableHighlight>
                      </Link>
                    ))}
                  {trendingTopics.data.length > 3 && (
                    <TouchableOpacity
                      onPress={() => {
                        setShowAll((s) => !s);
                        if (showAll) {
                          ref.current?.scrollToOffset({
                            animated: true,
                            offset: 0,
                          });
                        }
                      }}
                      className="mt-2"
                    >
                      <View className="flex-row items-center justify-center py-1">
                        <Text className="text-center">
                          {showAll ? "Show less" : "Show all"}
                        </Text>
                        {showAll ? (
                          <ChevronUpIcon
                            className="ml-2"
                            color={theme.colors.text}
                            size={16}
                          />
                        ) : (
                          <ChevronDownIcon
                            className="ml-2"
                            color={theme.colors.text}
                            size={16}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text className="mt-1 text-base">
                  Could not fetch trending topics
                </Text>
              )
            ) : (
              <ActivityIndicator className="mt-2" />
            )}
            <Text className="mt-4 px-4 text-lg font-bold">
              Suggested follows
            </Text>
          </View>
        }
        onEndReached={() => suggestions.fetchNextPage()}
        contentInsetAdjustmentBehavior="automatic"
        ListFooterComponent={<ListFooterComponent query={suggestions} />}
        onEndReachedThreshold={0.6}
      />
    );
  }

  return <QueryWithoutData query={suggestions} />;
};

interface SuggestionCardProps {
  item: AppBskyActorDefs.ProfileView;
}

const SuggestionCard = ({ item }: SuggestionCardProps) => {
  const agent = useAgent();
  const router = useRouter();
  const ref = useRef(item.did);
  const queryClient = useQueryClient();
  const theme = useTheme();
  const path = useAbsolutePath();

  const href = path(`/profile/${item.handle}`);

  const follow = useMutation({
    mutationKey: ["follow", item.did],
    mutationFn: async () => {
      return await agent.follow(item.did);
    },
  });

  if (ref.current !== item.did) {
    ref.current = item.did;
    follow.reset();
  }

  return (
    <Link href={href} asChild>
      <TouchableWithoutFeedback>
        <View
          className="mx-4 mt-4 rounded-lg p-4"
          style={{
            backgroundColor: theme.colors.card,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
          }}
        >
          <View className="flex-row items-center">
            <Image
              recyclingKey={item.did}
              source={{ uri: item.avatar }}
              className="mr-4 h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800"
              alt={item.displayName}
            />
            <View className="flex-1 justify-center">
              {item.displayName && (
                <Text className="text-base font-semibold">
                  {item.displayName}
                </Text>
              )}
              <Text className="text-neutral-500 dark:text-neutral-400">
                @{item.handle}
              </Text>
            </View>
            {!item.viewer?.following && (
              <TouchableOpacity
                disabled={follow.isPending}
                onPress={() => {
                  if (follow.isPending) return;
                  if (follow.isSuccess) {
                    router.push(href);
                    void queryClient.invalidateQueries({
                      queryKey: ["network"],
                    });
                  } else {
                    follow.mutate();
                  }
                }}
                className={cx(
                  "shrink-0 rounded-full border-white px-4 py-1",
                  follow.isIdle
                    ? theme.dark
                      ? theme.colors.card
                      : "bg-black"
                    : "bg-neutral-100",
                )}
                style={{ borderWidth: StyleSheet.hairlineWidth }}
              >
                <Text className={cx("text-sm", follow.isIdle && "text-white")}>
                  {follow.isIdle ? "Follow" : "Following"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {item.description && (
            <View className="mt-4">
              <RichTextWithoutFacets text={item.description} size="sm" />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Link>
  );
};
