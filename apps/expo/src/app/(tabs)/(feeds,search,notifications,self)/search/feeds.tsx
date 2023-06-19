import { useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";

import { FeedPost } from "../../../../components/feed-post";
import { FeedRow } from "../../../../components/feed-row";
import { ItemSeparator } from "../../../../components/item-separator";
import { QueryWithoutData } from "../../../../components/query-without-data";
import { useTabPressScrollRef } from "../../../../lib/hooks";
import { api } from "../../../../lib/utils/api";
import { useUserRefresh } from "../../../../lib/utils/query";

interface Props {
  search: string;
}

const FeedSearch = ({ search }: Props) => {
  const theme = useTheme();
  const query = api.search.feed.useQuery(search, {
    keepPreviousData: true,
  });
  const [ref, onScroll] = useTabPressScrollRef(query.refetch);
  const { handleRefresh, refreshing } = useUserRefresh(query.refetch);

  if (query.data) {
    return (
      <FlashList<AppBskyFeedDefs.GeneratorView>
        contentInsetAdjustmentBehavior="automatic"
        ref={ref}
        onScroll={onScroll}
        data={query.data.feeds}
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
              No feeds found - maybe try a different search term?
            </Text>
          </View>
        }
      />
    );
  }

  return <QueryWithoutData query={query} />;
};

export default function FeedSearchScreen() {
  const { q } = useLocalSearchParams() as { q: string };
  const [search, setSearch] = useState(q || "");

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: "Search feeds",
            onChangeText: (evt) => setSearch(evt.nativeEvent.text),
          },
        }}
      />
      <FeedSearch search={search} />
    </>
  );
}
