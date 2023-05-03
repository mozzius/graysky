import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useNavigation, useRouter } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react-native";

import { useAuthedAgent } from "../../lib/agent";
import { queryClient } from "../../lib/query-client";
import { cx } from "../../lib/utils/cx";

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const ref = useRef<TextInput>(null!);
  const navigation = useNavigation();

  useEffect(() => {
    // @ts-expect-error doesn't know what kind of navigator it is
    const unsub = navigation.addListener("tabPress", () => {
      if (navigation.isFocused()) {
        ref.current.focus();
      }
    });

    return unsub;
  }, [navigation]);

  return (
    <>
      <SafeAreaView
        edges={["left", "top", "right"]}
        className="dark:bg-dark border-b border-neutral-200 bg-white p-4"
      >
        <View className="relative">
          <Search
            className="absolute left-4 top-2.5 z-10"
            size={24}
            color="#b9b9b9"
          />
          <TextInput
            ref={ref}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            className="rounded-full bg-neutral-100 py-3 pl-12 pr-2 text-base leading-5"
          />
        </View>
      </SafeAreaView>
      {search ? <SearchResults search={search} /> : <Suggestions />}
    </>
  );
}
interface Props {
  search: string;
}
const SearchResults = ({ search }: Props) => {
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

  const data = useMemo(() => {
    if (!searchResults.data) return [];
    return searchResults.data.pages.flatMap((page) => page.actors);
  }, [searchResults.data]);

  switch (searchResults.status) {
    case "loading":
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      );
    case "error":
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="mb-4 text-center text-lg">
            {(searchResults.error as Error).message || "An error occurred"}
          </Text>
        </View>
      );
    case "success":
      return (
        <View className="flex-1 dark:bg-black">
          <FlashList
            data={data}
            estimatedItemSize={173}
            ListHeaderComponent={
              <Text className="mt-4 px-4 text-lg font-bold">
                In your network
              </Text>
            }
            renderItem={({ item }: { item: AppBskyActorDefs.ProfileView }) => (
              <SuggestionCard item={item} />
            )}
            onEndReached={() => void searchResults.fetchNextPage()}
          />
        </View>
      );
  }
};

const Suggestions = () => {
  const agent = useAuthedAgent();
  const suggestions = useQuery({
    queryKey: ["network"],
    queryFn: async () => {
      const { data, success } = await agent.getSuggestions();
      if (!success) throw new Error("Failed to get suggestions");
      return data;
    },
  });

  switch (suggestions.status) {
    case "loading":
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      );
    case "error":
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="mb-4 text-center text-lg">
            {(suggestions.error as Error).message || "An error occurred"}
          </Text>
        </View>
      );
    case "success":
      return (
        <View className="flex-1 dark:bg-black">
          <FlashList
            data={suggestions.data.actors}
            estimatedItemSize={173}
            renderItem={({ item }: { item: AppBskyActorDefs.ProfileView }) => (
              <SuggestionCard item={item} />
            )}
          />
        </View>
      );
  }
};

interface SuggestionCardProps {
  item: AppBskyActorDefs.ProfileView;
}

const SuggestionCard = ({ item }: SuggestionCardProps) => {
  const agent = useAuthedAgent();
  const router = useRouter();
  const ref = useRef(item.did);

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
        <View className="mx-4 mt-4 rounded bg-white p-4 shadow-sm">
          <View className="flex-row items-center">
            <Image
              key={item.avatar}
              source={{ uri: item.avatar }}
              className="mr-4 h-10 w-10 rounded-full bg-neutral-200"
              alt={item.displayName}
            />
            <View className="flex-1 justify-center">
              {item.displayName && (
                <Text className="text-base font-semibold dark:text-neutral-50">
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
                  "shrink-0 rounded-full px-4 py-1",
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
            <Text className="mt-4 dark:text-neutral-50">
              {item.description}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Link>
  );
};
