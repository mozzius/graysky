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
import { Link, Stack, useRouter } from "expo-router";
import { AppBskyUnspeccedDefs, type AppBskyActorDefs } from "@atproto/api";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
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

import { Avatar } from "~/components/avatar";
import { GroupedList } from "~/components/grouped-list";
import { ItemSeparator } from "~/components/item-separator";
import { ListFooterComponent } from "~/components/list-footer";
import { PersonRow } from "~/components/lists/person-row";
import { OpenDrawerAvatar } from "~/components/open-drawer-avatar";
import { QueryWithoutData } from "~/components/query-without-data";
import { RichText } from "~/components/rich-text";
import { Text } from "~/components/themed/text";
import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useAgent } from "~/lib/agent";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { useTabPress } from "~/lib/hooks/tab-press-scroll";
import { useQuickAction } from "~/lib/quick-actions";
import { cx } from "~/lib/utils/cx";

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const action = useQuickAction();
  const theme = useTheme();
  const { _ } = useLingui();

  const autoFocus = action?.id === "search";

  const ref = useRef<SearchBarCommands>(null);

  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: _(msg`Search users, posts, feeds`),
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
          title: _(msg`Search`),
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
          headerLargeStyle: {
            backgroundColor: theme.colors.background,
          },
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
  const { _ } = useLingui();

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
        <Animated.View entering={FadeInUp} className="flex-1">
          <GroupedList
            contentInsetAdjustmentBehavior="automatic"
            groups={[
              {
                options: [
                  {
                    icon: SearchIcon,
                    title: _(msg`Search posts`),
                    href: path(`/search/posts?q=${encodeURIComponent(search)}`),
                  },
                  {
                    icon: SearchIcon,
                    title: _(msg`Search feeds`),
                    href: path(`/search/feeds?q=${encodeURIComponent(search)}`),
                  },
                  data.length === 0
                    ? {
                        icon: SearchIcon,
                        title: _(msg`Search users`),
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
                              title: _(msg`Search all users`),
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
        </Animated.View>
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

const Suggestions = () => {
  const agent = useAgent();
  const theme = useTheme();
  const path = useAbsolutePath();
  const ref = useRef<FlashList<AppBskyActorDefs.ProfileView>>(null);

  const trendingTopics = useQuery({
    queryKey: ["trending-topics"],
    queryFn: async () => {
      const trending = await agent.app.bsky.unspecced.getTrendingTopics();
      if (!trending.success) throw new Error("Failed to get trending topics");
      return trending.data.topics;
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

  if (suggestions.data) {
    const data = suggestions.data.pages.flatMap((page) => page.data.actors);
    return (
      <FlashList<AppBskyActorDefs.ProfileView>
        removeClippedSubviews
        ref={ref}
        data={data}
        estimatedItemSize={173}
        renderItem={({ item }) => <SuggestionCard item={item} />}
        ListHeaderComponent={
          <View>
            {!trendingTopics.isPending ? (
              trendingTopics.data ? (
                <>
                  <Text className="mt-4 px-4 text-lg font-bold">
                    <Trans>Trending topics</Trans>
                  </Text>
                  <View className="flex-row flex-wrap gap-2 px-4 py-2">
                    {trendingTopics.data.map((tag) => (
                      <Link
                        key={tag.topic}
                        asChild
                        href={path(
                          tag.link.replace(
                            "trending.bsky.app",
                            "did:plc:qrz3lhbyuxbeilrc6nekdqme",
                          ),
                        )}
                      >
                        <TouchableHighlight className="rounded-full">
                          <View
                            className="flex-row rounded-full px-3 py-1"
                            style={{
                              backgroundColor: theme.colors.card,
                              borderWidth: StyleSheet.hairlineWidth,
                              borderColor: theme.colors.border,
                            }}
                          >
                            <Text
                              className="text-sm font-semibold"
                              numberOfLines={1}
                            >
                              {tag.topic}
                            </Text>
                          </View>
                        </TouchableHighlight>
                      </Link>
                    ))}
                  </View>
                </>
              ) : (
                <Text className="mt-1 px-4 text-base">
                  <Trans>Could not fetch trending topics</Trans>
                </Text>
              )
            ) : (
              <ActivityIndicator className="mt-2" />
            )}
            <Text className="mt-4 px-4 text-lg font-bold">
              <Trans>Suggested follows</Trans>
            </Text>
          </View>
        }
        onEndReached={() => suggestions.fetchNextPage()}
        contentInsetAdjustmentBehavior="automatic"
        ListFooterComponent={<ListFooterComponent query={suggestions} />}
        onEndReachedThreshold={2}
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
          className="mx-4 my-2 rounded-lg p-4"
          style={{
            backgroundColor: theme.colors.card,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
          }}
        >
          <View className="flex-row items-center">
            <Avatar
              uri={item.avatar}
              className="mr-4"
              alt={item.displayName ?? `@${item.handle}`}
              size="medium"
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
                <Text
                  className={cx(
                    "text-sm",
                    follow.isIdle ? "text-white" : "text-black",
                  )}
                >
                  {follow.isIdle ? (
                    <Trans>Follow</Trans>
                  ) : (
                    <Trans
                      id="following.action"
                      comment="'Following' - following a user"
                    >
                      Following
                    </Trans>
                  )}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {item.description && (
            <View className="mt-4">
              <RichText text={item.description} size="sm" detectFacets />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Link>
  );
};

function isBannedTag(tag: string) {
  return tag
    .toLocaleLowerCase()
    .match(/(porn)|(nsfw)|(award)|(troconud)|(sdv)|(followback)/i);
}
