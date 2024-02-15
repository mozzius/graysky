import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshControl, View } from "react-native";
import { type SearchBarCommands } from "react-native-screens";
import { Stack, useLocalSearchParams } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { FlashList } from "@shopify/flash-list";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { FeedPost } from "~/components/feed-post";
import { ListFooterComponent } from "~/components/list-footer";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useTabPressScrollRef } from "~/lib/hooks";
import { useContentFilter, type FilterResult } from "~/lib/hooks/preferences";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { useUserRefresh } from "~/lib/utils/query";

interface Props {
  search: string;
}

const PostsSearch = ({ search }: Props) => {
  const agent = useAgent();
  const { contentFilter } = useContentFilter();

  const query = useInfiniteQuery({
    queryKey: ["search", "posts", search],
    queryFn: async ({ pageParam }) => {
      if (!search) return Promise.resolve({ posts: [], cursor: undefined });
      const posts = await agent.app.bsky.feed.searchPosts({
        q: search,
        cursor: pageParam,
        limit: 25,
      });
      if (!posts.success) throw new Error("Could not get posts");
      return posts.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
    placeholderData: keepPreviousData,
  });

  const [ref, onScroll] = useTabPressScrollRef<{
    item: AppBskyFeedDefs.PostView;
    filter: FilterResult;
  }>(query.refetch);
  const { handleRefresh, refreshing, tintColor } = useUserRefresh(
    query.refetch,
  );

  const data = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages
      .flatMap((page) => page.posts)
      .map((item) => ({
        item,
        filter: contentFilter(item.labels),
      }));
  }, [query.data, contentFilter]);

  if (query.data) {
    return (
      <FlashList<{ item: AppBskyFeedDefs.PostView; filter: FilterResult }>
        estimatedItemSize={264}
        contentInsetAdjustmentBehavior="automatic"
        ref={ref}
        onScroll={onScroll}
        data={data}
        renderItem={({ item }) => (
          <FeedPost
            item={{
              post: item.item,
            }}
            filter={item.filter}
            inlineParent
            dataUpdatedAt={query.dataUpdatedAt}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
        onEndReached={() => query.fetchNextPage()}
        onEndReachedThreshold={2}
        ListFooterComponent={
          <ListFooterComponent
            query={query}
            hideEmptyMessage={data.length === 0}
          />
        }
        ListEmptyComponent={
          !query.isPending && (
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-center text-neutral-500 dark:text-neutral-400">
                {search ? (
                  <Trans>
                    No posts found - maybe try a different search term?
                  </Trans>
                ) : (
                  <Trans>Search for posts</Trans>
                )}
              </Text>
            </View>
          )
        }
      />
    );
  }

  return <QueryWithoutData query={query} />;
};

export default function PostsSearchScreen() {
  const { _ } = useLingui();

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
    placeholder: _(msg`Search posts`),
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    hideWhenScrolling: false,
    hideNavigationBar: false,
    ref,
  });

  return (
    <>
      <Stack.Screen
        options={{ title: _(msg`Search Posts`), headerSearchBarOptions }}
      />
      <PostsSearch search={search} />
    </>
  );
}
