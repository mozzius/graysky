import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, Stack, useNavigation, useRouter } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Search, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { ComposeButton } from "../../../components/compose-button";
import { QueryWithoutData } from "../../../components/query-without-data";
import { useAuthedAgent } from "../../../lib/agent";
import { useTabPressScroll } from "../../../lib/hooks";
import { queryClient } from "../../../lib/query-client";
import { cx } from "../../../lib/utils/cx";
import { useUserRefresh } from "../../../lib/utils/query";

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const ref = useRef<TextInput>(null!);
  const navigation = useNavigation();

  useEffect(() => {
    // @ts-expect-error doesn't know what kind of navigator it is
    const unsub = navigation.getParent()?.addListener("tabPress", () => {
      if (navigation.isFocused()) {
        ref.current.focus();
      }
    });

    return unsub;
  }, [navigation]);

  const { colorScheme } = useColorScheme();

  return (
    <>
      <SafeAreaView
        edges={["left", "top", "right"]}
        mode="padding"
        className="border-b border-neutral-200 bg-white p-4 dark:border-neutral-600 dark:bg-black"
      >
        <Stack.Screen options={{ headerShown: false }} />

        <View className="relative">
          <Search
            className="absolute left-4 top-2.5 z-10"
            size={24}
            color={colorScheme === "light" ? "#b9b9b9" : "#6b6b6b"}
            pointerEvents="none"
          />
          <TextInput
            ref={ref}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={
              colorScheme === "light" ? "#b9b9b9" : "#6b6b6b"
            }
            className="rounded-full bg-neutral-100 px-12 py-3 pr-2 text-base leading-5 dark:bg-neutral-800 dark:text-neutral-50"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch("");
                Keyboard.dismiss();
              }}
              className="absolute right-4 top-2.5 z-10"
            >
              <X
                size={24}
                color={colorScheme === "light" ? "#b9b9b9" : "#6b6b6b"}
              />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
      {search ? <SearchResults search={search} /> : <Suggestions />}
      <ComposeButton />
    </>
  );
}
interface Props {
  search: string;
}
const SearchResults = ({ search }: Props) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<FlashList<any>>(null);
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

  const { refreshing, handleRefresh } = useUserRefresh(searchResults.refetch);

  useTabPressScroll(ref);

  const data = useMemo(() => {
    if (!searchResults.data) return [];
    return searchResults.data.pages.flatMap((page) => page.actors);
  }, [searchResults.data]);

  if (searchResults.data) {
    return (
      <View className="flex-1 dark:bg-black">
        <FlashList
          ref={ref}
          data={data}
          estimatedItemSize={173}
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
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

  const { refreshing, handleRefresh } = useUserRefresh(suggestions.refetch);

  useTabPressScroll(ref);

  if (suggestions.data) {
    return (
      <View className="flex-1 dark:bg-black">
        <FlashList
          data={suggestions.data.pages.flatMap((page) => page.data.actors)}
          estimatedItemSize={173}
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
          renderItem={({ item }: { item: AppBskyActorDefs.ProfileView }) => (
            <SuggestionCard item={item} />
          )}
          ListHeaderComponent={
            <Text className="mt-4 px-4 text-lg font-bold dark:text-white">
              In your network
            </Text>
          }
          onEndReached={() => void suggestions.fetchNextPage()}
        />
      </View>
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
              key={item.avatar}
              source={{ uri: item.avatar }}
              className="mr-4 h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800"
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
            <Text className="mt-4 dark:text-neutral-50">
              {item.description}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </Link>
  );
};
