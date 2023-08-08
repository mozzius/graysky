import { Fragment, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Search } from "lucide-react-native";

import { GroupedList } from "../../../../components/grouped-list";
import { ItemSeparator } from "../../../../components/item-separator";
import { PersonRow } from "../../../../components/lists/person-row";
import { QueryWithoutData } from "../../../../components/query-without-data";
import { RichTextWithoutFacets } from "../../../../components/rich-text";
import { useAgent } from "../../../../lib/agent";
import { cx } from "../../../../lib/utils/cx";
import { useRefreshOnFocus } from "../../../../lib/utils/query";

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // focus search bar somehow :/
  // useTabPress();

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: "Search users, posts, feeds",
            onChangeText: (evt) => setSearch(evt.nativeEvent.text),
            onFocus: () => setIsSearching(true),
            onBlur: () => setIsSearching(false),
          },
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

  const MAX_RESULTS = 6;

  const searchResults = useQuery({
    queryKey: ["search", "people", search, MAX_RESULTS],
    queryFn: async () => {
      const { data, success } = await agent.searchActors({
        term: search,
        limit: MAX_RESULTS,
      });
      if (!success) throw new Error("Failed to search");
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
    keepPreviousData: true,
  });

  const data = useMemo(() => {
    if (!searchResults.data) return [];
    return searchResults.data.actors;
  }, [searchResults.data]);

  if (searchResults.data) {
    return (
      <GroupedList
        contentInsetAdjustmentBehavior="automatic"
        groups={[
          {
            options: [
              {
                icon: Search,
                title: "Search posts",
                href: `/search/posts?q=${search}`,
              },
              {
                icon: Search,
                title: "Search feeds",
                href: `/search/feeds?q=${search}`,
              },
              data.length === 0
                ? {
                    icon: Search,
                    title: "Search users",
                    href: `/search/people?q=${search}`,
                  }
                : [],
            ].flat(),
          },
          data.length > 0
            ? {
                children: data.slice(0, 5).map((item, i) => (
                  <Fragment key={item.did}>
                    <PersonRow person={item} />
                    {i !== data.length - 2 ? (
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
                          icon: Search,
                          title: "Search all users",
                          href: `/search/people?q=${search}`,
                        },
                      ]
                    : [],
              }
            : [],
        ].flat()}
      />
    );
  }

  return <QueryWithoutData query={searchResults} />;
};

const Suggestions = () => {
  const agent = useAgent();

  const suggestions = useInfiniteQuery({
    queryKey: ["network"],
    queryFn: async ({ pageParam }) => {
      const result = await agent.getSuggestions({
        cursor: pageParam as string | undefined,
      });
      if (!result.success) throw new Error("Failed to get suggestions");
      return result;
    },
    getNextPageParam: (lastPage) => lastPage.data.cursor,
  });

  useRefreshOnFocus(suggestions.refetch);

  const theme = useTheme();

  if (suggestions.data) {
    return (
      <FlashList<AppBskyActorDefs.ProfileView>
        data={suggestions.data.pages.flatMap((page) => page.data.actors)}
        estimatedItemSize={173}
        renderItem={({ item }) => <SuggestionCard item={item} />}
        ListHeaderComponent={
          <Text
            style={{ color: theme.colors.text }}
            className="mt-4 px-4 text-lg font-bold"
          >
            In your network
          </Text>
        }
        onEndReached={() => void suggestions.fetchNextPage()}
        contentInsetAdjustmentBehavior="automatic"
        ListFooterComponent={<View className="h-4" />}
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

  const href = `/profile/${item.handle}`;

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
                <Text
                  style={{ color: theme.colors.text }}
                  className="text-base font-semibold"
                >
                  {item.displayName}
                </Text>
              )}
              <Text className="text-neutral-500 dark:text-neutral-400">
                @{item.handle}
              </Text>
            </View>
            {!item.viewer?.following && (
              <TouchableOpacity
                disabled={follow.isLoading}
                onPress={() => {
                  if (follow.isLoading) return;
                  if (follow.isSuccess) {
                    router.push(href);
                    void queryClient.invalidateQueries(["network"]);
                  } else {
                    follow.mutate();
                  }
                }}
                className={cx(
                  "shrink-0 rounded-full border border-white px-4 py-1",
                  follow.isIdle ? "bg-black" : "bg-neutral-100",
                )}
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
