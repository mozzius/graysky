import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, View } from "react-native";
import { type SearchBarCommands } from "react-native-screens";
import { Stack, useLocalSearchParams } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";

import { ItemSeparator } from "../../../../components/item-separator";
import { PersonRow } from "../../../../components/lists/person-row";
import { QueryWithoutData } from "../../../../components/query-without-data";
import { Text } from "../../../../components/text";
import { useAgent } from "../../../../lib/agent";
import { useTabPressScrollRef } from "../../../../lib/hooks";
import { useSearchBarOptions } from "../../../../lib/hooks/search-bar";
import { useUserRefresh } from "../../../../lib/utils/query";

interface Props {
  search: string;
}

const PeopleSearch = ({ search }: Props) => {
  const agent = useAgent();
  const theme = useTheme();

  const query = useInfiniteQuery({
    queryKey: ["search", "people", search, "all"],
    queryFn: async ({ pageParam }) => {
      const profile = await agent.searchActors({
        term: search,
        cursor: pageParam as string | undefined,
      });
      if (!profile.success) throw new Error("Search failed");
      return profile.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
    keepPreviousData: true,
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
          />
        }
        onEndReachedThreshold={0.6}
        onEndReached={() => void query.fetchNextPage()}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-center text-neutral-500 dark:text-neutral-400">
              No users found - maybe try a different search term?
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
  const [search, setSearch] = useState(q || "");

  const ref = useRef<SearchBarCommands>(null);

  useEffect(() => {
    setTimeout(() => {
      if (ref.current && q) ref.current.setText(q || "");
    }, 50);
  }, [q]);

  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: "Search people",
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    hideWhenScrolling: false,
    hideNavigationBar: false,
    ref,
  });

  return (
    <>
      <Stack.Screen options={{ headerSearchBarOptions }} />
      <PeopleSearch search={search} />
    </>
  );
}
