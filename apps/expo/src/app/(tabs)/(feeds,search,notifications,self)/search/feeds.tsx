import { useEffect, useRef, useState } from "react";
import { RefreshControl, View } from "react-native";
import { type SearchBarCommands } from "react-native-screens";
import { Stack, useLocalSearchParams } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { FeedRow } from "~/components/feed-row";
import { ItemSeparator } from "~/components/item-separator";
import { ListFooterComponent } from "~/components/list-footer";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useTabPressScrollRef } from "~/lib/hooks";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { useUserRefresh } from "~/lib/utils/query";

interface Props {
  search: string;
}

const FeedSearch = ({ search }: Props) => {
  const theme = useTheme();
  const agent = useAgent();

  const query = useInfiniteQuery({
    queryKey: ["feed-search", search],
    queryFn: async ({ pageParam }) => {
      const feeds = await agent.app.bsky.unspecced.getPopularFeedGenerators({
        query: search,
        cursor: pageParam,
      });

      if (!feeds.success) throw new Error("Failed to fetch feeds");
      return feeds.data;
    },
    placeholderData: keepPreviousData,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const [ref, onScroll] = useTabPressScrollRef<AppBskyFeedDefs.GeneratorView>(
    query.refetch,
  );
  const { handleRefresh, refreshing } = useUserRefresh(query.refetch);

  const data = query.data?.pages.flatMap((page) => page.feeds) ?? [];

  if (query.data) {
    return (
      <FlashList<AppBskyFeedDefs.GeneratorView>
        contentInsetAdjustmentBehavior="automatic"
        ref={ref}
        onScroll={onScroll}
        data={data}
        renderItem={({ item }) => <FeedRow feed={item} large />}
        estimatedItemSize={82}
        ItemSeparatorComponent={() => (
          <ItemSeparator
            iconWidth="w-10"
            backgroundColor={theme.dark ? "black" : "white"}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-center text-neutral-500 dark:text-neutral-400">
              {search
                ? "No feeds found - maybe try a different search term?"
                : "Search for feeds"}
            </Text>
          </View>
        }
        ListFooterComponent={<ListFooterComponent query={query} />}
        onEndReached={() => query.fetchNextPage()}
        onEndReachedThreshold={2}
      />
    );
  }

  return <QueryWithoutData query={query} />;
};

export default function FeedSearchScreen() {
  const { q } = useLocalSearchParams() as { q: string };
  const query = decodeURIComponent(q || "");
  const [search, setSearch] = useState(query);

  const ref = useRef<SearchBarCommands>(null);

  useEffect(() => {
    setTimeout(() => {
      if (ref.current && query) ref.current.setText(query);
    }, 50);
  }, [query]);

  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: "Search feeds",
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    hideWhenScrolling: false,
    hideNavigationBar: false,
    ref,
  });

  return (
    <>
      <Stack.Screen
        options={{ title: "Search Feeds", headerSearchBarOptions }}
      />
      <FeedSearch search={search} />
    </>
  );
}
