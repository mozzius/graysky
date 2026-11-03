import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, View } from "react-native";
import { type SearchBarCommands } from "react-native-screens";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
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
import { isIOS26 } from "~/lib/utils/version";

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
      return await agent.call(app.bsky.actor.searchActors, {
        term: search,
        cursor: pageParam,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    placeholderData: keepPreviousData,
  });

  const [ref, onScroll] = useTabPressScrollRef<app.bsky.actor.defs.ProfileView>(
    query.refetch,
  );
  const { handleRefresh, refreshing } = useUserRefresh(query.refetch);

  const data = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages.flatMap((page) => page.actors);
  }, [query.data]);

  if (query.data) {
    return (
      <FlashList<app.bsky.actor.defs.ProfileView>
        removeClippedSubviews
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReachedThreshold={2}
        onEndReached={() => query.fetchNextPage()}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-center text-neutral-500 dark:text-neutral-400">
              {search ? (
                <Trans>
                  No users found - maybe try a different search term?
                </Trans>
              ) : (
                <Trans>Search for users</Trans>
              )}
            </Text>
          </View>
        }
      />
    );
  }

  return <QueryWithoutData query={query} />;
};

export default function PeopleSearchScreen() {
  const { _ } = useLingui();

  const { q } = useLocalSearchParams();
  const query = decodeURIComponent(typeof q === "string" ? q : "");
  const [search, setSearch] = useState(query);

  const ref = useRef<SearchBarCommands>(null!);

  useEffect(() => {
    setTimeout(() => {
      if (ref.current && query) ref.current.setText(query);
    }, 50);
  }, [query]);

  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: _(msg`Search people`),
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    hideWhenScrolling: false,
    hideNavigationBar: false,
    ref,
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: _(msg`Search People`),
          headerSearchBarOptions,
          headerTransparent: isIOS26,
        }}
      />
      <PeopleSearch search={search} />
    </>
  );
}
