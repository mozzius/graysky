import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, View } from "react-native";
import { type SearchBarCommands } from "react-native-screens";
import { Stack, useLocalSearchParams } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { ItemSeparator } from "~/components/item-separator";
import { PersonRow } from "~/components/lists/person-row";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useTabPressScrollRef } from "~/lib/hooks";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { useUserRefresh } from "~/lib/utils/query";

interface Props {
  search: string;
}

const PeopleSearch = ({ search }: Props) => {
  const agent = useAgent();
  const theme = useTheme();

  const query = useInfiniteQuery({
    queryKey: ["search", "people", search, "all"],
    queryFn: async ({ pageParam }) => {
      if (!search) return { actors: [] };
      const profile = await agent.searchActors({
        term: search,
        cursor: pageParam,
      });
      if (!profile.success) throw new Error("検索に失敗しました");
      return profile.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    placeholderData: keepPreviousData,
  });

  const [ref, onScroll] = useTabPressScrollRef<AppBskyActorDefs.ProfileView>(
    query.refetch,
  );
  const { handleRefresh, refreshing } = useUserRefresh(query.refetch);

  const data = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages.flatMap((page) => page.actors);
  }, [query.data]);

  if (query.data) {
    return (
      <FlashList<AppBskyActorDefs.ProfileView>
        contentInsetAdjustmentBehavior="automatic"
        ref={ref}
        onScroll={onScroll}
        data={data}
        renderItem={({ item }) => (
          <PersonRow
            person={item}
            backgroundColor={theme.dark ? "black" : "white"}
          />
        )}
        ItemSeparatorComponent={() => (
          <ItemSeparator
            iconWidth="w-10"
            backgroundColor={theme.dark ? "black" : "white"}
          />
        )}
        estimatedItemSize={56}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReachedThreshold={2}
        onEndReached={() => query.fetchNextPage()}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-center text-neutral-500 dark:text-neutral-400">
              {search
                ? "ユーザーが見つかりません - 別の検索語を使うと良いかもしれないですよ?"
                : "ユーザーを検索"}
            </Text>
          </View>
        }
      />
    );
  }

  return <QueryWithoutData query={query} />;
};

export default function PeopleSearchScreen() {
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
    placeholder: "Search people",
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    hideWhenScrolling: false,
    hideNavigationBar: false,
    ref,
  });

  return (
    <>
      <Stack.Screen
        options={{ title: "人を検索", headerSearchBarOptions }}
      />
      <PeopleSearch search={search} />
    </>
  );
}
