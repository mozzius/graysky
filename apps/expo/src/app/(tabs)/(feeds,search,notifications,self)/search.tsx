import { useMemo, useRef, useState } from "react";
import {
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link, Stack, useRouter } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { ComposeButton } from "../../../components/compose-button";
import { QueryWithoutData } from "../../../components/query-without-data";
import { useAuthedAgent } from "../../../lib/agent";
import { useTabPressScroll } from "../../../lib/hooks";
import { cx } from "../../../lib/utils/cx";

export default function SearchPage() {
  const [search, setSearch] = useState("");

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: "Search",
            onChangeText: (evt) => setSearch(evt.nativeEvent.text),
          },
        }}
      />
      {search ? <SearchResults search={search} /> : <Suggestions />}
      <ComposeButton />
    </>
  );
}
interface Props {
  search: string;
}
const SearchResults = ({ search }: Props) => {
  const ref = useRef<FlashList<AppBskyActorDefs.ProfileView>>(null);
  const agent = useAuthedAgent();

  const searchResults = useInfiniteQuery({
    queryKey: ["search", search],
    queryFn: async ({ pageParam }) => {
      const { data, success } = await agent.searchActors({
        term: search,
        cursor: pageParam as string | undefined,
        limit: 15,
      });
      if (!success) throw new Error("Failed to search");
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
    keepPreviousData: true,
  });

  const onScroll = useTabPressScroll(ref);

  const data = useMemo(() => {
    if (!searchResults.data) return [];
    return searchResults.data.pages.flatMap((page) => page.actors);
  }, [searchResults.data]);

  if (searchResults.data) {
    return (
      <View className="flex-1 dark:bg-black">
        <FlashList<AppBskyActorDefs.ProfileView>
          contentInsetAdjustmentBehavior="automatic"
          ref={ref}
          data={data}
          onScroll={onScroll}
          estimatedItemSize={173}
          renderItem={({ item }: { item: AppBskyActorDefs.ProfileView }) => (
            <SuggestionCard item={item} />
          )}
          onEndReached={() => void searchResults.fetchNextPage()}
        />
      </View>
    );
  }

  return <QueryWithoutData query={searchResults} />;
};

const Suggestions = () => {
  const ref = useRef<FlashList<AppBskyActorDefs.ProfileView>>(null);
  const agent = useAuthedAgent();

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

  const onScroll = useTabPressScroll(ref);

  if (suggestions.data) {
    return (
      <FlashList<AppBskyActorDefs.ProfileView>
        ref={ref}
        onScroll={onScroll}
        data={suggestions.data.pages.flatMap((page) => page.data.actors)}
        estimatedItemSize={173}
        renderItem={({ item }) => <SuggestionCard item={item} />}
        ListHeaderComponent={
          <Text className="mt-4 px-4 text-lg font-bold dark:text-white">
            In your network
          </Text>
        }
        onEndReached={() => void suggestions.fetchNextPage()}
        contentInsetAdjustmentBehavior="automatic"
      />
    );
  }

  return <QueryWithoutData query={suggestions} />;
};

interface SuggestionCardProps {
  item: AppBskyActorDefs.ProfileView;
}

const SuggestionCard = ({ item }: SuggestionCardProps) => {
  const agent = useAuthedAgent();
  const router = useRouter();
  const ref = useRef(item.did);
  const queryClient = useQueryClient();

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
        <View className="mx-4 mt-4 rounded bg-white p-4 shadow-sm dark:bg-neutral-900">
          <View className="flex-row items-center">
            <Image
              recyclingKey={item.did}
              source={{ uri: item.avatar }}
              className="mr-4 h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800"
              alt={item.displayName}
            />
            <View className="flex-1 justify-center">
              {item.displayName && (
                <Text className="text-base font-semibold dark:text-white">
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
            <Text className="mt-4 dark:text-white">{item.description}</Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Link>
  );
};
