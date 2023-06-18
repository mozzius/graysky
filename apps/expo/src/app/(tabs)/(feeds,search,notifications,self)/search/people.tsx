import { useMemo, useState } from "react";
import { RefreshControl } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { FeedPost } from "../../../../components/feed-post";
import { ItemSeparator } from "../../../../components/item-separator";
import { PersonRow } from "../../../../components/lists/person-row";
import { QueryWithoutData } from "../../../../components/query-without-data";
import { useAuthedAgent } from "../../../../lib/agent";
import { useTabPressScrollRef } from "../../../../lib/hooks";
import { useUserRefresh } from "../../../../lib/utils/query";
import { searchProfiles } from "../../../../lib/utils/search";

interface Props {
  search: string;
}

const PeopleSearch = ({ search }: Props) => {
  const agent = useAuthedAgent();
  const theme = useTheme();

  const query = useInfiniteQuery({
    queryKey: ["search", "people", search],
    queryFn: async ({ pageParam }) => {
      const profile = await agent.searchActors({
        term: search,
        cursor: pageParam,
      });
      if (!profile.success) throw new Error("Search failed");
      return profile.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const [ref, onScroll] = useTabPressScrollRef(query.refetch);
  const { handleRefresh, refreshing } = useUserRefresh(query.refetch);

  const data = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages.flatMap((page) => page.actors);
  }, []);

  if (query.data) {
    return (
      <FlashList<AppBskyActorDefs.ProfileView>
        contentInsetAdjustmentBehavior="automatic"
        ref={ref}
        onScroll={onScroll}
        data={data}
        renderItem={({ item }) => <PersonRow person={item} />}
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
      />
    );
  }

  return <QueryWithoutData query={query} />;
};

export default function PeopleSearchScreen() {
  const { q } = useLocalSearchParams() as { q: string };
  const [search, setSearch] = useState(q || "");

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: "Search people",
            onChangeText: (evt) => setSearch(evt.nativeEvent.text),
          },
        }}
      />
      <PeopleSearch search={search} />
    </>
  );
}
