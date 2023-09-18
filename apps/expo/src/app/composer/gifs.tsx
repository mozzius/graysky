import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaFrame } from "react-native-safe-area-context";
import { type SearchBarCommands } from "react-native-screens";
import { ResizeMode, Video } from "expo-av";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { MasonryFlashList } from "@shopify/flash-list";
import Sentry from "sentry-expo";

import { type TenorResponse } from "@graysky/api/src/router/gifs";

import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/text";
import { useAgent } from "~/lib/agent";
import { useHaptics } from "~/lib/hooks/preferences";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { locale } from "~/lib/locale";
import { api } from "~/lib/utils/api";
import { cx } from "~/lib/utils/cx";

export default function GifSearch() {
  const ref = useRef<SearchBarCommands>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { width } = useSafeAreaFrame();
  const theme = useTheme();

  const headerSearchBarOptions = useSearchBarOptions({
    ref,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onChangeText: (evt) => setQuery(evt.nativeEvent.text),
    onCancelButtonPress: () => {
      setQuery("");
      ref.current?.blur();
    },
    placeholder: "Search Tenor",
    hideWhenScrolling: false,
  });

  const langTag = locale.languageTag.includes("-")
    ? locale.languageTag.replace("-", "_")
    : undefined;

  const featured = api.gifs.tenor.featured.useInfiniteQuery(
    { locale: langTag },
    { getNextPageParam: (lastPage) => lastPage.next },
  );

  const isSearching = query.length > 0;

  const search = api.gifs.tenor.search.useInfiniteQuery(
    {
      query: query.trim(),
      locale: langTag,
    },
    {
      enabled: isSearching,
      keepPreviousData: true,
      getNextPageParam: (lastPage) => lastPage.next,
    },
  );

  const trendingTerms = api.gifs.tenor.trendingTerms.useQuery({
    locale: langTag,
  });

  if (focused && !isSearching) {
    if (trendingTerms.data) {
      return (
        <>
          <Stack.Screen options={{ headerSearchBarOptions }} />
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            className="px-4"
          >
            <Text className="my-4 text-xs">Trending terms</Text>
            {trendingTerms.data.results.map((term) => (
              <TouchableOpacity
                onPress={() => setQuery(term)}
                key={term}
                className="w-full flex-1 border-b px-2 py-3"
                style={{ borderColor: theme.colors.border }}
              >
                <Text className="text-lg">{term}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      );
    }

    return (
      <>
        <Stack.Screen options={{ headerSearchBarOptions }} />
        <QueryWithoutData query={trendingTerms} />
      </>
    );
  }

  const gifQuery = isSearching ? search : featured;

  if (gifQuery.data) {
    return (
      <>
        <Stack.Screen options={{ headerSearchBarOptions }} />
        <MasonryFlashList
          data={gifQuery.data.pages.flatMap((page) => page.results)}
          contentInsetAdjustmentBehavior="automatic"
          numColumns={2}
          overrideItemLayout={(layout, item) => {
            const aspectRatio =
              item.media_formats.tinymp4.dims[0]! /
              item.media_formats.tinymp4.dims[1]!;
            layout.span = (width - 16) / 2;
            layout.size = (layout.span - 4) / aspectRatio + 8;
          }}
          onEndReached={() => featured.fetchNextPage()}
          estimatedItemSize={200}
          ListFooterComponent={
            featured.isFetching ? (
              <View className="w-full items-center py-4">
                <ActivityIndicator size="small" />
              </View>
            ) : (
              <View className="h-20" />
            )
          }
          contentContainerStyle={{ paddingHorizontal: 16 }}
          optimizeItemArrangement
          renderItem={({ item, columnIndex }) => (
            <Gif item={item} column={columnIndex} />
          )}
          drawDistance={0}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions,
        }}
      />
      <QueryWithoutData query={gifQuery} />
    </>
  );
}

interface GifProps {
  item: TenorResponse;
  column: number;
}

const Gif = ({ item, column }: GifProps) => {
  const router = useRouter();
  const haptics = useHaptics();
  const agent = useAgent();

  const select = api.gifs.select.useMutation({
    onMutate: () => haptics.impact(),
    onSuccess: (result) => {
      router.push("../");
      router.setParams({ gif: JSON.stringify(result) });
    },
    onError: (err) => {
      Sentry.Native.captureException(err);
      Alert.alert("Could not select GIF", "Please try again later");
    },
  });

  const aspectRatio =
    item.media_formats.tinymp4.dims[0]! / item.media_formats.tinymp4.dims[1]!;

  return (
    <View className={cx("mb-2 flex-1", column === 0 ? "pr-1" : "pl-1")}>
      <TouchableHighlight
        className="relative w-full flex-1 rounded-lg"
        onPress={() => {
          if (!agent.session)
            throw new Error("No session when trying to select a gif");
          select.mutate({
            id: item.id,
            assetUrl: item.media_formats.mp4.url,
            previewUrl: item.media_formats.gifpreview.url,
            description: item.content_description,
            token: agent.session.accessJwt,
          });
        }}
        onLongPress={() => Linking.openURL(item.url)}
        style={{ aspectRatio }}
      >
        <Video
          accessibilityLabel={item.content_description}
          key={item.media_formats.tinymp4.url}
          source={{ uri: item.media_formats.tinymp4.url }}
          pointerEvents="none"
          className="w-full flex-1 rounded-lg bg-neutral-50 dark:bg-neutral-950"
          resizeMode={ResizeMode.COVER}
          isMuted
          isLooping
          shouldPlay
        />
      </TouchableHighlight>
    </View>
  );
};
