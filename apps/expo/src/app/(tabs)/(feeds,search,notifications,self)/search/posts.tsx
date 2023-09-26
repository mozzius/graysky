import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, View } from "react-native";
import { type SearchBarCommands } from "react-native-screens";
import { Stack, useLocalSearchParams } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";

import { FeedPost } from "~/components/feed-post";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/text";
import { useAgent } from "~/lib/agent";
import { useTabPressScrollRef } from "~/lib/hooks";
import { useContentFilter, type FilterResult } from "~/lib/hooks/preferences";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { useUserRefresh } from "~/lib/utils/query";
import { searchPosts } from "~/lib/utils/search";

interface Props {
  search: string;
}

const PostsSearch = ({ search }: Props) => {
  const agent = useAgent();
  const { contentFilter } = useContentFilter();

  const query = useQuery({
    queryKey: ["search", "posts", search],
    queryFn: async ({ signal }) => {
      if (!search) return [];
      const posts = await searchPosts(search, signal);

      if (posts.length === 0) return [];

      // split into groups of 25
      const groups = posts.reduce<string[][]>(
        (acc, p) => {
          if (acc[acc.length - 1]!.length === 25) {
            acc.push([`at://${p.user.did}/${p.tid}`]);
          } else {
            acc[acc.length - 1]!.push(`at://${p.user.did}/${p.tid}`);
          }
          return acc;
        },
        [[]],
      );

      const all = await Promise.all(
        groups.map((chunk) =>
          agent.getPosts({
            uris: chunk,
          }),
        ),
      ).then((x) =>
        x
          .flatMap((x) => x.data.posts)
          .map((post) => ({ post, reply: undefined, reason: undefined })),
      );

      return all;
    },
    keepPreviousData: true,
  });

  const [ref, onScroll] = useTabPressScrollRef<{
    item: AppBskyFeedDefs.FeedViewPost;
    filter: FilterResult;
  }>(query.refetch);
  const { handleRefresh, refreshing } = useUserRefresh(query.refetch);

  const data = useMemo(() => {
    if (!query.data) return [];
    return query.data.map((item) => ({
      item,
      filter: contentFilter(item.post.labels),
    }));
  }, [query.data, contentFilter]);

  if (query.data) {
    return (
      <FlashList<{ item: AppBskyFeedDefs.FeedViewPost; filter: FilterResult }>
        estimatedItemSize={264}
        contentInsetAdjustmentBehavior="automatic"
        ref={ref}
        onScroll={onScroll}
        data={data}
        renderItem={({ item }) => (
          <FeedPost
            {...item}
            inlineParent
            dataUpdatedAt={query.dataUpdatedAt}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-center text-neutral-500 dark:text-neutral-400">
              {search
                ? "No posts found - maybe try a different search term?"
                : "Search for posts"}
            </Text>
          </View>
        }
        extraData={query.dataUpdatedAt}
      />
    );
  }

  return <QueryWithoutData query={query} />;
};

export default function PostsSearchScreen() {
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
    placeholder: "Search posts",
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    hideWhenScrolling: false,
    hideNavigationBar: false,
    ref,
  });

  return (
    <>
      <Stack.Screen
        options={{ title: "Search Posts", headerSearchBarOptions }}
      />
      <PostsSearch search={search} />
    </>
  );
}
